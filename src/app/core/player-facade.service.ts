import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy, signal } from '@angular/core';
import { EMPTY, Subscription, catchError, exhaustMap, timer } from 'rxjs';
import { DeviceStorageService } from './device-storage.service';
import { PlayerApiService } from './player-api.service';
import {
  ActivationStatus,
  HeartbeatPayload,
  PendingActivation,
  PlayerConfiguration,
  PlayerVisualState
} from './player.models';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class PlayerFacadeService implements OnDestroy {
  readonly state = signal<PlayerVisualState>('INICIANDO');
  readonly activation = signal<PendingActivation | null>(null);
  readonly configuration = signal<PlayerConfiguration | null>(null);
  readonly connectionUnavailable = signal(false);

  private activationPolling?: Subscription;
  private syncPolling?: Subscription;
  private heartbeatPolling?: Subscription;
  private invalidationTimer?: number;
  private currentMediaId?: number;
  private lastSynchronization?: string;
  private invalidating = false;

  constructor(
    private readonly api: PlayerApiService,
    private readonly storage: DeviceStorageService,
    private readonly runtimeConfig: RuntimeConfigService
  ) {}

  start(): void {
    const credential = this.storage.getCredential();
    if (credential) {
      this.startAuthenticated(credential);
      return;
    }
    const pending = this.storage.getPendingActivation();
    if (pending && new Date(pending.expiraEm).getTime() > Date.now()) {
      this.activation.set(pending);
      this.state.set('AGUARDANDO_ATIVACAO');
      this.startActivationPolling(pending.identificador);
      return;
    }
    this.createActivation();
  }

  createActivation(): void {
    this.stopAllPolling();
    this.storage.clearPendingActivation();
    this.activation.set(null);
    this.state.set('INICIANDO');
    this.api.createActivation().subscribe({
      next: (created) => {
        this.storage.savePendingActivation(created);
        this.activation.set(created);
        this.connectionUnavailable.set(false);
        this.state.set('AGUARDANDO_ATIVACAO');
        this.startActivationPolling(created.identificador);
      },
      error: () => {
        this.connectionUnavailable.set(true);
        this.state.set('CONEXAO_INDISPONIVEL');
      }
    });
  }

  resetDevice(): void {
    this.stopAllPolling();
    this.storage.reset();
    this.configuration.set(null);
    this.currentMediaId = undefined;
    this.lastSynchronization = undefined;
    this.createActivation();
  }

  shutdown(): void {
    this.stopAllPolling();
  }

  setCurrentMedia(mediaId: number | undefined): void {
    this.currentMediaId = mediaId;
    if (mediaId !== undefined) {
      this.state.set('REPRODUZINDO');
    }
  }

  retry(): void {
    if (this.storage.getCredential()) {
      this.startAuthenticated(this.storage.getCredential()!);
    } else {
      this.createActivation();
    }
  }

  ngOnDestroy(): void {
    this.stopAllPolling();
  }

  private startActivationPolling(identifier: string): void {
    this.activationPolling?.unsubscribe();
    this.activationPolling = timer(
      0,
      this.runtimeConfig.value.activationPollIntervalMs
    )
      .pipe(
        exhaustMap(() =>
          this.api.getActivationStatus(identifier).pipe(
            catchError(() => {
              this.connectionUnavailable.set(true);
              return EMPTY;
            })
          )
        )
      )
      .subscribe((status) => this.handleActivationStatus(status));
  }

  private handleActivationStatus(status: ActivationStatus): void {
    this.connectionUnavailable.set(false);
    if (status.status === 'AGUARDANDO_VINCULO') {
      return;
    }
    if (status.status === 'ATIVACAO_CONCLUIDA' && status.credencial) {
      this.activationPolling?.unsubscribe();
      this.storage.saveCredential(status.credencial);
      this.storage.clearPendingActivation();
      this.activation.set(null);
      this.startAuthenticated(status.credencial);
      return;
    }
    this.activationPolling?.unsubscribe();
    this.storage.clearPendingActivation();
    this.state.set('ATIVACAO_EXPIRADA');
  }

  private startAuthenticated(credential: string): void {
    this.stopAllPolling();
    this.invalidating = false;
    this.state.set('SINCRONIZANDO');
    this.syncPolling = timer(0, this.runtimeConfig.value.syncIntervalMs)
      .pipe(
        exhaustMap(() => {
          const versions = this.versionsForNextSync();
          return this.api
            .getConfiguration(
              credential,
              versions.configurationVersion,
              versions.playlistVersion
            )
            .pipe(catchError((error) => this.handleAuthenticatedError(error)));
        })
      )
      .subscribe((response) => this.handleConfiguration(response));

    this.heartbeatPolling = timer(
      0,
      this.runtimeConfig.value.heartbeatIntervalMs
    )
      .pipe(
        exhaustMap(() =>
          this.api
            .sendHeartbeat(credential, this.heartbeatPayload())
            .pipe(catchError((error) => this.handleAuthenticatedError(error)))
        )
      )
      .subscribe(() => this.connectionUnavailable.set(false));
  }

  private handleConfiguration(response: PlayerConfiguration): void {
    this.connectionUnavailable.set(false);
    this.lastSynchronization = new Date().toISOString();
    if (!response.alterada && this.configuration()) {
      return;
    }
    const normalized: PlayerConfiguration = {
      ...response,
      itens: [...response.itens].sort((first, second) => first.ordem - second.ordem)
    };
    this.configuration.set(normalized);
    this.state.set(
      normalized.estado === 'SEM_CONTEUDO' || normalized.itens.length === 0
        ? 'SEM_CONTEUDO'
        : 'REPRODUZINDO'
    );
  }

  private versionsForNextSync(): {
    configurationVersion?: number;
    playlistVersion?: number;
  } {
    const current = this.configuration();
    if (!current || this.urlsNeedRenewal(current)) {
      return {};
    }
    return {
      configurationVersion: current.tela.versaoConfiguracao,
      playlistVersion: current.playlist?.versao
    };
  }

  private urlsNeedRenewal(configuration: PlayerConfiguration): boolean {
    const threshold =
      Date.now() + Math.max(120_000, this.runtimeConfig.value.syncIntervalMs * 2);
    return configuration.itens.some((item) => {
      const expiration = item.midia.urlExpiraEm;
      return expiration !== null && new Date(expiration).getTime() <= threshold;
    });
  }

  private heartbeatPayload(): HeartbeatPayload {
    const current = this.configuration();
    return {
      versaoPlayer: '0.1.0',
      versaoConfiguracao: current?.tela.versaoConfiguracao,
      playlistId: current?.playlist?.id,
      playlistVersao: current?.playlist?.versao,
      midiaAtualId: this.currentMediaId,
      resolucaoTela: `${window.screen.width}x${window.screen.height}`,
      userAgent: navigator.userAgent.slice(0, 500),
      ultimaSincronizacaoEm: this.lastSynchronization
    };
  }

  private handleAuthenticatedError(error: unknown) {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.invalidateCredential();
    } else {
      this.connectionUnavailable.set(true);
      if (!this.configuration()) {
        this.state.set('CONEXAO_INDISPONIVEL');
      }
    }
    return EMPTY;
  }

  private invalidateCredential(): void {
    if (this.invalidating) {
      return;
    }
    this.invalidating = true;
    this.stopAllPolling();
    this.storage.reset();
    this.configuration.set(null);
    this.activation.set(null);
    this.state.set('DISPOSITIVO_INVALIDO');
    this.invalidationTimer = window.setTimeout(() => {
      this.invalidating = false;
      this.createActivation();
    }, 1500);
  }

  private stopAllPolling(): void {
    this.activationPolling?.unsubscribe();
    this.syncPolling?.unsubscribe();
    this.heartbeatPolling?.unsubscribe();
    this.activationPolling = undefined;
    this.syncPolling = undefined;
    this.heartbeatPolling = undefined;
    if (this.invalidationTimer !== undefined) {
      window.clearTimeout(this.invalidationTimer);
      this.invalidationTimer = undefined;
    }
  }
}

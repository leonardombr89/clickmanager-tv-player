import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ActivationCreated,
  ActivationStatus,
  HeartbeatPayload,
  HeartbeatResponse,
  PlayerConfiguration
} from './player.models';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class PlayerApiService {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpClient,
    config: RuntimeConfigService
  ) {
    this.baseUrl = `${config.value.apiBaseUrl}/api/public/clicktv/player`;
  }

  createActivation(): Observable<ActivationCreated> {
    return this.http.post<ActivationCreated>(`${this.baseUrl}/ativacoes`, {});
  }

  getActivationStatus(identifier: string): Observable<ActivationStatus> {
    return this.http.get<ActivationStatus>(
      `${this.baseUrl}/ativacoes/${encodeURIComponent(identifier)}/status`
    );
  }

  getConfiguration(
    credential: string,
    currentConfigurationVersion?: number,
    currentPlaylistVersion?: number
  ): Observable<PlayerConfiguration> {
    let params = new HttpParams();
    if (currentConfigurationVersion !== undefined) {
      params = params.set('versaoConfiguracao', currentConfigurationVersion);
    }
    if (currentPlaylistVersion !== undefined) {
      params = params.set('playlistVersao', currentPlaylistVersion);
    }
    return this.http.get<PlayerConfiguration>(`${this.baseUrl}/configuracao`, {
      headers: this.authorization(credential),
      params
    });
  }

  sendHeartbeat(
    credential: string,
    payload: HeartbeatPayload
  ): Observable<HeartbeatResponse> {
    return this.http.post<HeartbeatResponse>(
      `${this.baseUrl}/heartbeat`,
      payload,
      { headers: this.authorization(credential) }
    );
  }

  private authorization(credential: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${credential}` });
  }
}

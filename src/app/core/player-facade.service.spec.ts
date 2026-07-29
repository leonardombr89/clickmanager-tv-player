import { HttpErrorResponse } from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { DeviceStorageService } from './device-storage.service';
import { PlayerApiService } from './player-api.service';
import { PlayerFacadeService } from './player-facade.service';
import {
  ActivationCreated,
  ActivationStatus,
  HeartbeatResponse,
  PlayerConfiguration
} from './player.models';
import { RuntimeConfigService } from './runtime-config.service';

describe('PlayerFacadeService', () => {
  let api: jasmine.SpyObj<PlayerApiService>;
  let storage: jasmine.SpyObj<DeviceStorageService>;
  let service: PlayerFacadeService;
  let activationStatus: Subject<ActivationStatus>;

  beforeEach(() => {
    api = jasmine.createSpyObj<PlayerApiService>('PlayerApiService', [
      'createActivation',
      'getActivationStatus',
      'getConfiguration',
      'sendHeartbeat'
    ]);
    storage = jasmine.createSpyObj<DeviceStorageService>('DeviceStorageService', [
      'getCredential',
      'saveCredential',
      'clearCredential',
      'getPendingActivation',
      'savePendingActivation',
      'clearPendingActivation',
      'reset'
    ]);
    activationStatus = new Subject<ActivationStatus>();
    api.getActivationStatus.and.returnValue(activationStatus);
    api.sendHeartbeat.and.returnValue(
      of({ recebidoEm: new Date().toISOString() } satisfies HeartbeatResponse)
    );
    storage.getCredential.and.returnValue(null);
    storage.getPendingActivation.and.returnValue(null);
    service = new PlayerFacadeService(
      api,
      storage,
      {
        value: {
          apiBaseUrl: '',
          syncIntervalMs: 1000,
          heartbeatIntervalMs: 500,
          activationPollIntervalMs: 100
        }
      } as RuntimeConfigService
    );
  });

  afterEach(() => service.shutdown());

  it('gera, exibe e consulta periodicamente uma ativação', fakeAsync(() => {
    const created: ActivationCreated = {
      identificador: 'identificador',
      codigo: '123456',
      expiraEm: new Date(Date.now() + 60_000).toISOString()
    };
    api.createActivation.and.returnValue(of(created));

    service.start();
    tick();

    expect(service.state()).toBe('AGUARDANDO_ATIVACAO');
    expect(service.activation()?.codigo).toBe('123456');
    expect(storage.savePendingActivation).toHaveBeenCalledWith(created);
    expect(api.getActivationStatus).toHaveBeenCalledWith('identificador');
  }));

  it('salva a credencial recebida, apaga a ativação e inicia a configuração', fakeAsync(() => {
    api.createActivation.and.returnValue(
      of({
        identificador: 'identificador',
        codigo: '123456',
        expiraEm: new Date(Date.now() + 60_000).toISOString()
      })
    );
    api.getConfiguration.and.returnValue(of(configuration(true)));

    service.start();
    tick();
    activationStatus.next({
      status: 'ATIVACAO_CONCLUIDA',
      expiraEm: null,
      credencial: 'credencial'
    });
    tick();

    expect(storage.saveCredential).toHaveBeenCalledWith('credencial');
    expect(storage.clearPendingActivation).toHaveBeenCalled();
    expect(api.getConfiguration).toHaveBeenCalledWith(
      'credencial',
      undefined,
      undefined
    );
    expect(service.state()).toBe('REPRODUZINDO');
  }));

  it('mostra expiração e permite gerar outro código', fakeAsync(() => {
    api.createActivation.and.returnValue(
      of({
        identificador: 'identificador',
        codigo: '123456',
        expiraEm: new Date(Date.now() + 60_000).toISOString()
      })
    );
    service.start();
    tick();
    activationStatus.next({
      status: 'EXPIRADA',
      expiraEm: null,
      credencial: null
    });

    expect(service.state()).toBe('ATIVACAO_EXPIRADA');
    expect(storage.clearPendingActivation).toHaveBeenCalled();
  }));

  it('preserva a configuração quando alterada=false', fakeAsync(() => {
    storage.getCredential.and.returnValue('credencial');
    const first = configuration(true);
    const unchanged = { ...first, alterada: false, itens: [] };
    let firstRequest = true;
    api.getConfiguration.and.callFake(() => {
      if (firstRequest) {
        firstRequest = false;
        return of(first);
      }
      return of(unchanged);
    });

    service.start();
    tick();
    expect(service.configuration()?.itens.length).toBe(2);
    tick(1000);

    expect(service.configuration()?.itens.length).toBe(2);
    expect(api.getConfiguration.calls.mostRecent().args).toEqual([
      'credencial',
      4,
      7
    ]);
  }));

  it('remove credencial inválida e retorna ao fluxo de ativação', fakeAsync(() => {
    storage.getCredential.and.returnValue('invalida');
    api.getConfiguration.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized'
          })
      )
    );
    api.createActivation.and.returnValue(
      of({
        identificador: 'novo-id',
        codigo: '654321',
        expiraEm: new Date(Date.now() + 60_000).toISOString()
      })
    );

    service.start();
    tick();
    expect(service.state()).toBe('DISPOSITIVO_INVALIDO');
    expect(storage.reset).toHaveBeenCalled();
    tick(1500);

    expect(service.state()).toBe('AGUARDANDO_ATIVACAO');
    expect(service.activation()?.codigo).toBe('654321');
  }));

  it('envia heartbeat sem telaId ou empresaId e encerra os timers', fakeAsync(() => {
    storage.getCredential.and.returnValue('credencial');
    api.getConfiguration.and.returnValue(of(configuration(true)));

    service.start();
    tick();

    expect(api.sendHeartbeat).toHaveBeenCalled();
    const payload = api.sendHeartbeat.calls.mostRecent().args[1] as unknown as Record<
      string,
      unknown
    >;
    expect(payload['telaId']).toBeUndefined();
    expect(payload['empresaId']).toBeUndefined();

    const callsBeforeShutdown = api.sendHeartbeat.calls.count();
    service.shutdown();
    tick(2000);
    expect(api.sendHeartbeat.calls.count()).toBe(callsBeforeShutdown);
  }));

  function configuration(altered: boolean): PlayerConfiguration {
    return {
      alterada: altered,
      estado: 'CONTEUDO_DISPONIVEL',
      tela: {
        id: 1,
        nome: 'TV',
        orientacao: 'HORIZONTAL',
        versaoConfiguracao: 4
      },
      playlist: {
        id: 2,
        nome: 'Principal',
        orientacao: 'HORIZONTAL',
        versao: 7
      },
      itens: [
        item(2, 2, 'VIDEO', null),
        item(1, 1, 'IMAGEM', 5)
      ]
    };
  }

  function item(
    id: number,
    order: number,
    type: 'IMAGEM' | 'VIDEO',
    duration: number | null
  ) {
    return {
      id,
      ordem: order,
      duracaoSegundos: duration,
      midia: {
        id: id + 10,
        nome: `Mídia ${id}`,
        tipo: type,
        orientacao: 'HORIZONTAL' as const,
        mimeType: type === 'IMAGEM' ? 'image/png' : 'video/mp4',
        largura: 1920,
        altura: 1080,
        url: `https://media/${id}`,
        urlExpiraEm: new Date(Date.now() + 3_600_000).toISOString()
      }
    };
  }
});

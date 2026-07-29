import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PlayerApiService } from './player-api.service';
import { RuntimeConfigService } from './runtime-config.service';

describe('PlayerApiService', () => {
  let service: PlayerApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: RuntimeConfigService,
          useValue: {
            value: {
              apiBaseUrl: 'https://api.example',
              syncIntervalMs: 60_000,
              heartbeatIntervalMs: 30_000,
              activationPollIntervalMs: 3_000
            }
          }
        }
      ]
    });
    service = TestBed.inject(PlayerApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta ativação pelo identificador secreto e nunca pelo código visível', () => {
    service.getActivationStatus('id secreto').subscribe();

    const request = http.expectOne(
      'https://api.example/api/public/clicktv/player/ativacoes/id%20secreto/status'
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.url).not.toContain('123456');
    request.flush({
      status: 'AGUARDANDO_VINCULO',
      expiraEm: null,
      credencial: null
    });
  });

  it('envia a credencial somente como Bearer e reaproveita as versões', () => {
    service.getConfiguration('segredo', 4, 9).subscribe();

    const request = http.expectOne(
      (candidate) =>
        candidate.url.endsWith('/configuracao') &&
        candidate.params.get('versaoConfiguracao') === '4' &&
        candidate.params.get('playlistVersao') === '9'
    );
    expect(request.request.headers.get('Authorization')).toBe('Bearer segredo');
    expect(request.request.urlWithParams).not.toContain('segredo');
    request.flush({
      alterada: false,
      estado: 'SEM_CONTEUDO',
      tela: {
        id: 1,
        nome: 'TV',
        orientacao: 'HORIZONTAL',
        versaoConfiguracao: 4
      },
      playlist: null,
      itens: []
    });
  });
});

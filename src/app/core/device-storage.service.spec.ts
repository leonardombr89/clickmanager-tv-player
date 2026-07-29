import { DeviceStorageService } from './device-storage.service';

describe('DeviceStorageService', () => {
  let service: DeviceStorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    service = new DeviceStorageService();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('armazena a credencial permanente separada da ativação temporária', () => {
    service.saveCredential('credencial-secreta');
    service.savePendingActivation({
      identificador: 'identificador-secreto',
      codigo: '123456',
      expiraEm: '2026-08-01T12:00:00'
    });

    expect(service.getCredential()).toBe('credencial-secreta');
    expect(service.getPendingActivation()?.codigo).toBe('123456');

    service.reset();
    expect(service.getCredential()).toBeNull();
    expect(service.getPendingActivation()).toBeNull();
  });
});

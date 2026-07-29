import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AppComponent } from './app.component';
import { PlayerFacadeService } from './core/player-facade.service';
import { PlayerVisualState } from './core/player.models';
import { WakeLockService } from './core/wake-lock.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let facade: {
    state: ReturnType<typeof signal<PlayerVisualState>>;
    activation: ReturnType<typeof signal>;
    configuration: ReturnType<typeof signal>;
    connectionUnavailable: ReturnType<typeof signal<boolean>>;
    start: jasmine.Spy;
    shutdown: jasmine.Spy;
    setCurrentMedia: jasmine.Spy;
    createActivation: jasmine.Spy;
    resetDevice: jasmine.Spy;
    retry: jasmine.Spy;
  };

  beforeEach(async () => {
    facade = {
      state: signal<PlayerVisualState>('AGUARDANDO_ATIVACAO'),
      activation: signal({
        identificador: 'identificador-que-nao-pode-aparecer',
        codigo: '123456',
        expiraEm: '2026-08-01T12:00:00'
      }),
      configuration: signal(null),
      connectionUnavailable: signal(false),
      start: jasmine.createSpy('start'),
      shutdown: jasmine.createSpy('shutdown'),
      setCurrentMedia: jasmine.createSpy('setCurrentMedia'),
      createActivation: jasmine.createSpy('createActivation'),
      resetDevice: jasmine.createSpy('resetDevice'),
      retry: jasmine.createSpy('retry')
    };
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: PlayerFacadeService, useValue: facade },
        {
          provide: WakeLockService,
          useValue: {
            request: () => Promise.resolve(),
            release: () => Promise.resolve()
          }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('exibe o código, mas nunca identificador ou credencial', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('123 456');
    expect(text).not.toContain('identificador-que-nao-pode-aparecer');
    expect(text.toLowerCase()).not.toContain('credencial');
  });

  it('exige confirmação para redefinir o dispositivo', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    fixture.componentInstance.resetDevice();
    expect(facade.resetDevice).not.toHaveBeenCalled();

    (window.confirm as jasmine.Spy).and.returnValue(true);
    fixture.componentInstance.resetDevice();
    expect(facade.resetDevice).toHaveBeenCalled();
  });
});

import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal
} from '@angular/core';
import { PlayerFacadeService } from './core/player-facade.service';
import { WakeLockService } from './core/wake-lock.service';
import { PlaybackComponent } from './player/playback.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PlaybackComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly interactionStarted = signal(false);
  readonly activationCode = computed(() => {
    const code = this.player.activation()?.codigo ?? '';
    return code ? `${code.slice(0, 3)} ${code.slice(3)}` : '';
  });
  readonly orientationClass = computed(() => {
    const orientation = this.player.configuration()?.tela.orientacao;
    return orientation ? `orientation-${orientation.toLowerCase()}` : '';
  });

  constructor(
    readonly player: PlayerFacadeService,
    private readonly wakeLock: WakeLockService
  ) {}

  @ViewChild('startButton')
  set startButton(button: ElementRef<HTMLButtonElement> | undefined) {
    button?.nativeElement.focus();
  }

  ngOnInit(): void {
    this.player.start();
  }

  ngOnDestroy(): void {
    this.player.shutdown();
    void this.wakeLock.release();
  }

  startExperience(): void {
    this.interactionStarted.set(true);
    void this.wakeLock.request();
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    }
  }

  resetDevice(): void {
    const confirmed = window.confirm(
      'Redefinir este dispositivo? Será necessário vinculá-lo novamente.'
    );
    if (confirmed) {
      this.interactionStarted.set(false);
      this.player.resetDevice();
    }
  }
}

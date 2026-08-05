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
import { DownloadPageComponent } from './download/download-page.component';
import { PlaybackComponent } from './player/playback.component';
import { PrivacyPageComponent } from './privacy/privacy-page.component';

type OrientationMode = 'automatic' | 'landscape';

interface ClickTvNativeBridge {
  setOrientation(mode: OrientationMode): boolean;
}

declare global {
  interface Window {
    ClickTV?: ClickTvNativeBridge;
  }
}

const ORIENTATION_STORAGE_KEY = 'clicktv.screen.orientation';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DownloadPageComponent, PlaybackComponent, PrivacyPageComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly downloadPage = window.location.pathname.replace(/\/+$/, '') === '/download';
  readonly privacyPage = ['/privacidade', '/privacy'].includes(
    window.location.pathname.replace(/\/+$/, '')
  );
  readonly interactionStarted = signal(false);
  readonly nativeAndroidApp = typeof window.ClickTV?.setOrientation === 'function';
  readonly landscapeLocked = signal(
    readOrientationPreference() === 'landscape'
  );
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
    if (!this.downloadPage && !this.privacyPage) {
      if (this.landscapeLocked()) {
        this.applyOrientation('landscape');
      }
      this.player.start();
    }
  }

  ngOnDestroy(): void {
    if (!this.downloadPage && !this.privacyPage) {
      this.player.shutdown();
    }
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

  toggleOrientation(): void {
    const mode: OrientationMode = this.landscapeLocked()
      ? 'automatic'
      : 'landscape';
    this.landscapeLocked.set(mode === 'landscape');
    writeOrientationPreference(mode);
    this.applyOrientation(mode);
  }

  private applyOrientation(mode: OrientationMode): void {
    window.ClickTV?.setOrientation(mode);
  }
}

function readOrientationPreference(): OrientationMode {
  try {
    return window.localStorage.getItem(ORIENTATION_STORAGE_KEY) === 'landscape'
      ? 'landscape'
      : 'automatic';
  } catch {
    return 'automatic';
  }
}

function writeOrientationPreference(mode: OrientationMode): void {
  try {
    window.localStorage.setItem(ORIENTATION_STORAGE_KEY, mode);
  } catch {
    // A orientacao ainda e aplicada na sessao quando o armazenamento nao existe.
  }
}

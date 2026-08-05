import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { PlayerItem } from '../core/player.models';

@Component({
  selector: 'app-playback',
  standalone: true,
  templateUrl: './playback.component.html',
  styleUrl: './playback.component.scss'
})
export class PlaybackComponent implements OnDestroy {
  @Output() readonly mediaChange = new EventEmitter<number | undefined>();

  currentItem: PlayerItem | null = null;
  mediaUrl = '';
  mediaVisible = false;

  private activeItems: PlayerItem[] = [];
  private pendingItems: PlayerItem[] | null = null;
  private currentIndex = 0;
  private mediaTimer?: number;
  private transitionTimer?: number;
  private transitionInProgress = false;
  private generation = 0;
  private activeVideo?: HTMLVideoElement;

  @Input()
  set items(value: PlayerItem[]) {
    const ordered = [...(value ?? [])].sort(
      (first, second) => first.ordem - second.ordem
    );
    if (this.currentItem) {
      this.pendingItems = ordered;
      return;
    }
    this.applyItems(ordered);
  }

  onImageLoaded(): void {
    this.revealMedia();
    this.clearMediaTimer();
    const duration = Math.max(1, this.currentItem?.duracaoSegundos ?? 5);
    this.mediaTimer = window.setTimeout(
      () => this.startTransition(),
      duration * 1000
    );
  }

  onVideoReady(video: HTMLVideoElement): void {
    this.activeVideo = video;
    this.revealMedia();
    void video.play().catch(() => undefined);
    this.scheduleVideoTimer();
  }

  @HostListener('document:keydown', ['$event'])
  onRemoteKeyDown(event: KeyboardEvent): void {
    const video = this.activeVideo;
    if (!video || this.currentItem?.midia.tipo !== 'VIDEO') {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'MediaPlayPause':
        if (event.repeat) {
          return;
        }
        event.preventDefault();
        if (video.paused) {
          this.playVideo(video);
        } else {
          this.pauseVideo(video);
        }
        break;
      case 'MediaPlay':
        event.preventDefault();
        this.playVideo(video);
        break;
      case 'MediaPause':
        event.preventDefault();
        this.pauseVideo(video);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - SEEK_SECONDS);
        break;
      case 'ArrowRight': {
        event.preventDefault();
        const target = video.currentTime + SEEK_SECONDS;
        video.currentTime = Number.isFinite(video.duration)
          ? Math.min(video.duration, target)
          : target;
        break;
      }
    }
  }

  onVideoEnded(): void {
    this.startTransition();
  }

  onMediaError(): void {
    this.startTransition();
  }

  ngOnDestroy(): void {
    this.clearMediaTimer();
    this.clearTransitionTimer();
    this.mediaChange.emit(undefined);
  }

  private startTransition(): void {
    if (this.transitionInProgress) {
      return;
    }

    this.clearMediaTimer();
    this.transitionInProgress = true;
    this.mediaVisible = false;
    this.transitionTimer = window.setTimeout(() => {
      this.transitionTimer = undefined;
      this.advance();
      this.transitionInProgress = false;
    }, TRANSITION_DURATION_MS);
  }

  private advance(): void {
    if (this.pendingItems) {
      const pending = this.pendingItems;
      this.pendingItems = null;
      this.applyItems(pending);
      return;
    }
    if (this.activeItems.length === 0) {
      this.setCurrent(null);
      return;
    }
    this.currentIndex = (this.currentIndex + 1) % this.activeItems.length;
    this.setCurrent(this.activeItems[this.currentIndex]);
  }

  private applyItems(items: PlayerItem[]): void {
    this.activeItems = items;
    this.currentIndex = 0;
    this.setCurrent(items[0] ?? null);
  }

  private setCurrent(item: PlayerItem | null): void {
    this.generation += 1;
    this.activeVideo = undefined;
    this.mediaVisible = false;
    this.currentItem = item;
    this.mediaUrl = item ? `${item.midia.url}#clicktv-${this.generation}` : '';
    this.mediaChange.emit(item?.midia.id);
    this.preloadNext();
  }

  private preloadNext(): void {
    if (this.activeItems.length < 2) {
      return;
    }
    const next = this.activeItems[(this.currentIndex + 1) % this.activeItems.length];
    if (next.midia.tipo === 'IMAGEM') {
      const image = new Image();
      image.src = next.midia.url;
    }
  }

  private clearMediaTimer(): void {
    if (this.mediaTimer !== undefined) {
      window.clearTimeout(this.mediaTimer);
      this.mediaTimer = undefined;
    }
  }

  private playVideo(video: HTMLVideoElement): void {
    void video.play().catch(() => undefined);
    this.scheduleVideoTimer();
  }

  private pauseVideo(video: HTMLVideoElement): void {
    video.pause();
    this.clearMediaTimer();
  }

  private scheduleVideoTimer(): void {
    this.clearMediaTimer();
    const duration = this.currentItem?.duracaoSegundos;
    if (duration && duration > 0) {
      this.mediaTimer = window.setTimeout(
        () => this.startTransition(),
        duration * 1000
      );
    }
  }

  private clearTransitionTimer(): void {
    if (this.transitionTimer !== undefined) {
      window.clearTimeout(this.transitionTimer);
      this.transitionTimer = undefined;
    }
    this.transitionInProgress = false;
  }

  private revealMedia(): void {
    this.mediaVisible = true;
  }
}

const TRANSITION_DURATION_MS = 500;
const SEEK_SECONDS = 10;

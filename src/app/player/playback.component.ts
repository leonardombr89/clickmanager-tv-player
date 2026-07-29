import {
  Component,
  EventEmitter,
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

  private activeItems: PlayerItem[] = [];
  private pendingItems: PlayerItem[] | null = null;
  private currentIndex = 0;
  private mediaTimer?: number;
  private generation = 0;

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
    this.clearMediaTimer();
    const duration = Math.max(1, this.currentItem?.duracaoSegundos ?? 5);
    this.mediaTimer = window.setTimeout(() => this.advance(), duration * 1000);
  }

  onVideoReady(video: HTMLVideoElement): void {
    void video.play().catch(() => undefined);
    this.clearMediaTimer();
    const duration = this.currentItem?.duracaoSegundos;
    if (duration && duration > 0) {
      this.mediaTimer = window.setTimeout(() => this.advance(), duration * 1000);
    }
  }

  onVideoEnded(): void {
    this.advance();
  }

  onMediaError(): void {
    this.advance();
  }

  ngOnDestroy(): void {
    this.clearMediaTimer();
    this.mediaChange.emit(undefined);
  }

  private advance(): void {
    this.clearMediaTimer();
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
}

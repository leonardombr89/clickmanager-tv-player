import { Injectable } from '@angular/core';

interface WakeLockSentinelLike {
  release(): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class WakeLockService {
  private sentinel: WakeLockSentinelLike | null = null;

  async request(): Promise<void> {
    const wakeLock = (
      navigator as unknown as {
        wakeLock?: {
          request(type: 'screen'): Promise<WakeLockSentinelLike>;
        };
      }
    ).wakeLock;
    if (!wakeLock || this.sentinel) {
      return;
    }
    try {
      this.sentinel = await wakeLock.request('screen');
    } catch {
      this.sentinel = null;
    }
  }

  async release(): Promise<void> {
    const current = this.sentinel;
    this.sentinel = null;
    if (current) {
      await current.release().catch(() => undefined);
    }
  }
}

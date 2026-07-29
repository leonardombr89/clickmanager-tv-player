import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface RuntimeConfig {
  apiBaseUrl: string;
  syncIntervalMs: number;
  heartbeatIntervalMs: number;
  activationPollIntervalMs: number;
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  readonly value: RuntimeConfig;

  constructor() {
    const runtime = window.__CLICKTV_CONFIG__ ?? {};
    this.value = {
      apiBaseUrl: this.normalizeUrl(runtime.apiBaseUrl ?? environment.apiBaseUrl),
      syncIntervalMs: this.seconds(
        runtime.syncIntervalSeconds,
        environment.syncIntervalSeconds
      ),
      heartbeatIntervalMs: this.seconds(
        runtime.heartbeatIntervalSeconds,
        environment.heartbeatIntervalSeconds
      ),
      activationPollIntervalMs: this.seconds(
        runtime.activationPollIntervalSeconds,
        environment.activationPollIntervalSeconds
      )
    };
  }

  private normalizeUrl(value: string): string {
    return value.trim().replace(/\/+$/, '');
  }

  private seconds(value: number | undefined, fallback: number): number {
    const safe = Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;
    return safe * 1000;
  }
}

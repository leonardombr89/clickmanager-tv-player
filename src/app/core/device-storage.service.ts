import { Injectable } from '@angular/core';
import { PendingActivation } from './player.models';

@Injectable({ providedIn: 'root' })
export class DeviceStorageService {
  private readonly credentialKey = 'clicktv.device.credential';
  private readonly activationKey = 'clicktv.device.activation';

  getCredential(): string | null {
    return this.read(localStorage, this.credentialKey);
  }

  saveCredential(credential: string): void {
    localStorage.setItem(this.credentialKey, credential);
  }

  clearCredential(): void {
    localStorage.removeItem(this.credentialKey);
  }

  getPendingActivation(): PendingActivation | null {
    const value = this.read(sessionStorage, this.activationKey);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as PendingActivation;
    } catch {
      this.clearPendingActivation();
      return null;
    }
  }

  savePendingActivation(activation: PendingActivation): void {
    sessionStorage.setItem(this.activationKey, JSON.stringify(activation));
  }

  clearPendingActivation(): void {
    sessionStorage.removeItem(this.activationKey);
  }

  reset(): void {
    this.clearCredential();
    this.clearPendingActivation();
  }

  private read(storage: Storage, key: string): string | null {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }
}

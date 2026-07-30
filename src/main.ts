import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

if (!window.__CLICKTV_LEGACY__) {
  bootstrapApplication(AppComponent, appConfig).catch(() => undefined);
}

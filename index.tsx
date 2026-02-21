
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './src/app.config';
import { AppComponent } from './src/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.

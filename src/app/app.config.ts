/**
 * Application Configuration
 * Provides all necessary Angular providers including WSO2 integration
 */
import { ApplicationConfig, provideZonelessChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor, errorInterceptor } from './core';
import { ConfigLoaderService, initializeApp } from './core/services/config-loader.service';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone change detection
    provideZonelessChangeDetection(),
    
    // Router with input binding for route params
    provideRouter(routes, withComponentInputBinding()),
    
    // HTTP client with WSO2 interceptors
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),

    provideAnimations(),
    
    // Load external configuration at startup
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigLoaderService],
      multi: true
    }
  ]
};

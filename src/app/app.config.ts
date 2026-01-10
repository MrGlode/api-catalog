import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { authInterceptor } from './core';

/**
 * Configuration principale de l'application WSO2 API Catalog
 * Compatible avec Angular v20 et Vite
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // Configuration du routeur avec binding automatique des inputs
    provideRouter(routes, withComponentInputBinding()),
    
    // Configuration HTTP avec intercepteur JWT (nouvelle syntaxe)
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    
    // Animations asynchrones (nouvelle méthode pour Angular v20)
    provideAnimationsAsync()
  ]
};
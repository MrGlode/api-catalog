import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Point d'entrée de l'application WSO2 API Catalog
 * Bootstrap l'application Angular en mode standalone
 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error('Erreur lors du démarrage de l\'application:', err));
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Service de configuration centralisé
 * Fournit un accès type-safe aux paramètres d'environnement
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  /**
   * URL de base de l'API Manager WSO2
   */
  get baseUrl(): string {
    return environment.wso2.baseUrl;
  }

  /**
   * URL de l'API Devportal v3
   */
  get devportalApiUrl(): string {
    return environment.wso2.devportalApiUrl;
  }

  /**
   * URL du endpoint de token OAuth2
   */
  get tokenUrl(): string {
    return environment.wso2.tokenUrl;
  }

  /**
   * URL d'enregistrement DCR (Dynamic Client Registration)
   */
  get dcrUrl(): string {
    return environment.wso2.dcrUrl;
  }

  /**
   * Tenant configuré (vide pour super tenant)
   */
  get tenant(): string {
    return environment.wso2.tenant;
  }

  /**
   * Client ID OAuth2
   */
  get clientId(): string {
    return environment.wso2.oauth2.clientId;
  }

  /**
   * Client Secret OAuth2
   */
  get clientSecret(): string {
    return environment.wso2.oauth2.clientSecret;
  }

  /**
   * Scopes OAuth2 requis
   */
  get scopes(): string {
    return environment.wso2.oauth2.scopes;
  }

  /**
   * Nom de l'application
   */
  get appName(): string {
    return environment.app.name;
  }

  /**
   * Version de l'application
   */
  get appVersion(): string {
    return environment.app.version;
  }

  /**
   * Nombre d'items par page par défaut
   */
  get itemsPerPage(): number {
    return environment.app.itemsPerPage;
  }

  /**
   * Délai avant expiration du token (buffer en secondes)
   */
  get tokenExpirationBuffer(): number {
    return environment.app.tokenExpirationBuffer;
  }

  /**
   * Indique si l'application est en mode production
   */
  get isProduction(): boolean {
    return environment.production;
  }

  /**
   * Construit une URL complète pour l'API Devportal
   * @param endpoint - Chemin de l'endpoint (ex: '/apis')
   * @returns URL complète
   */
  getDevportalUrl(endpoint: string): string {
    // Enlever le slash initial si présent
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${this.devportalApiUrl}/${cleanEndpoint}`;
  }

  /**
   * Vérifie si les credentials OAuth2 sont configurés
   * @returns true si clientId et clientSecret sont définis
   */
  hasOAuthCredentials(): boolean {
    return !!this.clientId && !!this.clientSecret;
  }
}
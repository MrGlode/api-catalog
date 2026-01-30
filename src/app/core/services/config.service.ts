import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Configuration Service (BFF Version)
 * 
 * Provides type-safe access to environment configuration.
 * 
 * SECURITY: This service no longer exposes OAuth client secrets.
 * Authentication is handled by the BFF server.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  // ===========================================================================
  // WSO2 Configuration
  // ===========================================================================

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
   * Tenant configuré
   */
  get tenant(): string {
    return environment.wso2.tenant;
  }

  // ===========================================================================
  // BFF Configuration
  // ===========================================================================

  /**
   * URL de base du BFF
   */
  get bffBaseUrl(): string {
    return environment.bff.baseUrl;
  }

  /**
   * URL de login
   */
  get loginUrl(): string {
    return environment.bff.auth.login;
  }

  /**
   * URL de refresh token
   */
  get refreshUrl(): string {
    return environment.bff.auth.refresh;
  }

  /**
   * URL de logout
   */
  get logoutUrl(): string {
    return environment.bff.auth.logout;
  }

  /**
   * URL d'inscription
   */
  get registerUrl(): string {
    return environment.bff.registration.register;
  }

  // ===========================================================================
  // App Configuration
  // ===========================================================================

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

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Construit une URL complète pour l'API Devportal
   */
  getDevportalUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${this.devportalApiUrl}/${cleanEndpoint}`;
  }

  // ===========================================================================
  // DEPRECATED METHODS
  // ===========================================================================

  /**
   * @deprecated OAuth credentials are now handled by BFF server
   */
  get clientId(): string {
    console.warn('clientId is deprecated - OAuth is handled by BFF server');
    return '';
  }

  /**
   * @deprecated OAuth credentials are now handled by BFF server
   */
  get clientSecret(): string {
    console.warn('clientSecret is deprecated - OAuth is handled by BFF server');
    return '';
  }

  /**
   * @deprecated OAuth credentials are now handled by BFF server
   */
  hasOAuthCredentials(): boolean {
    console.warn('hasOAuthCredentials is deprecated - OAuth is handled by BFF server');
    return true; // Always true since BFF handles this
  }
}
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  Application,
  ApplicationList,
  ApplicationKey,
  ApplicationToken,
  ApplicationTokenGenerateRequest,
  APIKey,
  APIKeyGenerateRequest,
  APIKeyRevokeRequest,
  ScopeList
} from '../../models';

/**
 * Service de gestion des Applications
 * Gère les applications, clés OAuth et tokens d'accès
 */
@Injectable({
  providedIn: 'root'
})
export class ApplicationService extends BaseApiService {
  // ==================== APPLICATIONS ====================

  /**
   * Récupère la liste des applications
   * @param groupId - Filtre par groupe (optionnel)
   * @param query - Recherche par nom (optionnel)
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste d'applications
   */
  getApplications(
    groupId?: string,
    query?: string,
    limit?: number,
    offset?: number
  ): Observable<ApplicationList> {
    const params = this.buildQueryParams({
      groupId,
      query,
      limit,
      offset
    });

    return this.get<ApplicationList>('/applications', { params });
  }

  /**
   * Récupère les détails d'une application
   * @param applicationId - Identifiant de l'application
   * @returns Observable de l'application
   */
  getApplicationById(applicationId: string): Observable<Application> {
    return this.get<Application>(`/applications/${applicationId}`);
  }

  /**
   * Crée une nouvelle application
   * @param application - Données de l'application
   * @returns Observable de l'application créée
   */
  createApplication(application: Partial<Application>): Observable<Application> {
    return this.post<Application>('/applications', application);
  }

  /**
   * Met à jour une application
   * @param applicationId - Identifiant de l'application
   * @param application - Données à mettre à jour
   * @returns Observable de l'application mise à jour
   */
  updateApplication(
    applicationId: string,
    application: Partial<Application>
  ): Observable<Application> {
    return this.put<Application>(`/applications/${applicationId}`, application);
  }

  /**
   * Supprime une application
   * @param applicationId - Identifiant de l'application
   * @returns Observable vide
   */
  deleteApplication(applicationId: string): Observable<void> {
    return this.delete<void>(`/applications/${applicationId}`);
  }

  // ==================== CLÉS OAUTH ====================

  /**
   * Génère des clés OAuth pour une application
   * @param applicationId - Identifiant de l'application
   * @param keyType - Type de clé (PRODUCTION ou SANDBOX)
   * @param keyManager - Nom du Key Manager (optionnel, "Resident Key Manager" par défaut)
   * @param grantTypes - Types de grants OAuth2 supportés
   * @param callbackUrl - URL de callback pour OAuth2
   * @param scopes - Scopes requis
   * @param validityTime - Durée de validité du token (en secondes)
   * @returns Observable de la clé générée
   */
  generateApplicationKeys(
    applicationId: string,
    keyType: 'PRODUCTION' | 'SANDBOX',
    keyManager?: string,
    grantTypes?: string[],
    callbackUrl?: string,
    scopes?: string[],
    validityTime?: number
  ): Observable<ApplicationKey> {
    const body = {
      keyType,
      keyManager: keyManager || 'Resident Key Manager',
      grantTypesToBeSupported: grantTypes || ['client_credentials', 'password', 'refresh_token'],
      callbackUrl: callbackUrl || '',
      scopes: scopes || [],
      validityTime: validityTime || 3600
    };

    return this.post<ApplicationKey>(
      `/applications/${applicationId}/generate-keys`,
      body
    );
  }

  /**
   * Récupère les clés d'une application
   * @param applicationId - Identifiant de l'application
   * @param keyType - Type de clé (PRODUCTION ou SANDBOX)
   * @returns Observable de la clé
   */
  getApplicationKeys(
    applicationId: string,
    keyType: 'PRODUCTION' | 'SANDBOX'
  ): Observable<ApplicationKey> {
    return this.get<ApplicationKey>(
      `/applications/${applicationId}/keys/${keyType}`
    );
  }

  /**
   * Met à jour les clés d'une application
   * @param applicationId - Identifiant de l'application
   * @param keyType - Type de clé
   * @param keyDetails - Détails de la clé à mettre à jour
   * @returns Observable de la clé mise à jour
   */
  updateApplicationKeys(
    applicationId: string,
    keyType: 'PRODUCTION' | 'SANDBOX',
    keyDetails: Partial<ApplicationKey>
  ): Observable<ApplicationKey> {
    return this.put<ApplicationKey>(
      `/applications/${applicationId}/keys/${keyType}`,
      keyDetails
    );
  }

  /**
   * Nettoie les clés d'une application (suppression)
   * @param applicationId - Identifiant de l'application
   * @param keyType - Type de clé
   * @returns Observable vide
   */
  cleanUpApplicationKeys(
    applicationId: string,
    keyType: 'PRODUCTION' | 'SANDBOX'
  ): Observable<void> {
    return this.post<void>(
      `/applications/${applicationId}/keys/${keyType}/clean-up`,
      {}
    );
  }

  // ==================== TOKENS ====================

  /**
   * Génère un token d'accès pour une application
   * @param applicationId - Identifiant de l'application
   * @param keyType - Type de clé
   * @param request - Requête de génération de token
   * @returns Observable du token
   */
  generateApplicationToken(
    applicationId: string,
    keyType: 'PRODUCTION' | 'SANDBOX',
    request: ApplicationTokenGenerateRequest
  ): Observable<ApplicationToken> {
    return this.post<ApplicationToken>(
      `/applications/${applicationId}/keys/${keyType}/generate-token`,
      request
    );
  }

  // ==================== API KEYS ====================

  /**
   * Génère une clé API pour une application
   * @param applicationId - Identifiant de l'application
   * @param keyType - Type de clé
   * @param request - Requête de génération de clé API
   * @returns Observable de la clé API
   */
  generateApiKey(
    applicationId: string,
    keyType: 'PRODUCTION' | 'SANDBOX',
    request?: APIKeyGenerateRequest
  ): Observable<APIKey> {
    return this.post<APIKey>(
      `/applications/${applicationId}/api-keys/${keyType}/generate`,
      request || {}
    );
  }

  /**
   * Révoque une clé API
   * @param applicationId - Identifiant de l'application
   * @param keyType - Type de clé
   * @param request - Requête de révocation contenant la clé API
   * @returns Observable vide
   */
  revokeApiKey(
    applicationId: string,
    keyType: 'PRODUCTION' | 'SANDBOX',
    request: APIKeyRevokeRequest
  ): Observable<void> {
    return this.post<void>(
      `/applications/${applicationId}/api-keys/${keyType}/revoke`,
      request
    );
  }

  // ==================== SCOPES ====================

  /**
   * Récupère les scopes disponibles pour une application
   * @param applicationId - Identifiant de l'application
   * @param filterByUserRoles - Filtrer par rôles de l'utilisateur
   * @returns Observable de la liste des scopes
   */
  getApplicationScopes(
    applicationId: string,
    filterByUserRoles?: boolean
  ): Observable<ScopeList> {
    const params = this.buildQueryParams({
      filterByUserRoles
    });

    return this.get<ScopeList>(
      `/applications/${applicationId}/scopes`,
      { params }
    );
  }

  // ==================== UTILITAIRES ====================

  /**
   * Mappe une application OAuth existante
   * @param applicationId - Identifiant de l'application
   * @param keyType - Type de clé
   * @param consumerKey - Clé consumer existante
   * @param keyManager - Nom du Key Manager
   * @returns Observable de la clé mappée
   */
  mapExistingOAuthApp(
    applicationId: string,
    keyType: 'PRODUCTION' | 'SANDBOX',
    consumerKey: string,
    keyManager: string
  ): Observable<ApplicationKey> {
    const body = {
      consumerKey,
      keyManager,
      keyType
    };

    return this.post<ApplicationKey>(
      `/applications/${applicationId}/map-keys`,
      body
    );
  }

  /**
   * Exporte une application
   * @param applicationId - Identifiant de l'application
   * @returns Observable du blob de l'export
   */
  exportApplication(applicationId: string): Observable<Blob> {
    return this.get<Blob>(
      `/applications/export?appId=${applicationId}`,
      { responseType: 'blob' as any }
    );
  }

  /**
   * Importe une application
   * @param file - Fichier de l'application à importer
   * @param preserveOwner - Préserver le propriétaire original
   * @param skipSubscriptions - Ignorer les souscriptions
   * @returns Observable de l'application importée
   */
  importApplication(
    file: File,
    preserveOwner?: boolean,
    skipSubscriptions?: boolean
  ): Observable<Application> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (preserveOwner !== undefined) {
      formData.append('preserveOwner', preserveOwner.toString());
    }
    if (skipSubscriptions !== undefined) {
      formData.append('skipSubscriptions', skipSubscriptions.toString());
    }

    // Note: Pour FormData, on ne définit pas le Content-Type
    // car le navigateur le fait automatiquement avec le boundary
    return this.post<Application>('/applications/import', formData);
  }
}
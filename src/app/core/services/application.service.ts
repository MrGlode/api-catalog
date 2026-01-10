/**
 * WSO2 Application Service
 * Handles application management with WSO2 API Manager Devportal
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment, getApiUrl } from '../../../environments/environment';
import {
  Application,
  ApplicationList,
  ApplicationRequest,
  ApplicationQueryParams,
  ApplicationKey,
  ApplicationKeyGenerateRequest,
  ApplicationKeyReGenerateResponse,
  ApplicationToken,
  ApplicationTokenGenerateRequest
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  constructor(private http: HttpClient) {}

  // ========================================
  // Applications CRUD
  // ========================================

  /**
   * Get list of applications
   */
  getApplications(params?: ApplicationQueryParams): Observable<ApplicationList> {
    const url = getApiUrl('/applications');
    let httpParams = new HttpParams();

    if (params?.query) {
      httpParams = httpParams.set('query', params.query);
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.offset) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }
    if (params?.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params?.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.http.get<ApplicationList>(url, { params: httpParams });
  }

  /**
   * Get application by ID
   */
  getApplicationById(applicationId: string): Observable<Application> {
    const url = getApiUrl(`/applications/${applicationId}`);
    
    return this.http.get<Application>(url);
  }

  /**
   * Create new application
   */
  createApplication(application: ApplicationRequest): Observable<Application> {
    const url = getApiUrl('/applications');
    
    return this.http.post<Application>(url, application);
  }

  /**
   * Update application
   */
  updateApplication(applicationId: string, application: ApplicationRequest): Observable<Application> {
    const url = getApiUrl(`/applications/${applicationId}`);
    
    return this.http.put<Application>(url, application);
  }

  /**
   * Delete application
   */
  deleteApplication(applicationId: string): Observable<void> {
    const url = getApiUrl(`/applications/${applicationId}`);
    
    return this.http.delete<void>(url);
  }

  // ========================================
  // Application Keys
  // ========================================

  /**
   * Get application OAuth keys
   */
  getApplicationKeys(applicationId: string): Observable<ApplicationKey[]> {
    const url = getApiUrl(`/applications/${applicationId}/oauth-keys`);
    
    return this.http.get<ApplicationKey[]>(url);
  }

  /**
   * Get specific OAuth key by mapping ID
   */
  getApplicationKey(applicationId: string, keyMappingId: string): Observable<ApplicationKey> {
    const url = getApiUrl(`/applications/${applicationId}/oauth-keys/${keyMappingId}`);
    
    return this.http.get<ApplicationKey>(url);
  }

  /**
   * Generate application keys
   */
  generateKeys(applicationId: string, request: ApplicationKeyGenerateRequest): Observable<ApplicationKey> {
    const url = getApiUrl(`/applications/${applicationId}/generate-keys`);
    
    return this.http.post<ApplicationKey>(url, request);
  }

  /**
   * Map existing OAuth app keys
   */
  mapKeys(
    applicationId: string, 
    keyType: 'PRODUCTION' | 'SANDBOX',
    consumerKey: string,
    consumerSecret: string,
    keyManager?: string
  ): Observable<ApplicationKey> {
    const url = getApiUrl(`/applications/${applicationId}/map-keys`);
    
    return this.http.post<ApplicationKey>(url, {
      keyType,
      consumerKey,
      consumerSecret,
      keyManager: keyManager || 'Resident Key Manager'
    });
  }

  /**
   * Update application key (grant types, callback URL)
   */
  updateApplicationKey(
    applicationId: string, 
    keyMappingId: string,
    key: Partial<ApplicationKey>
  ): Observable<ApplicationKey> {
    const url = getApiUrl(`/applications/${applicationId}/oauth-keys/${keyMappingId}`);
    
    return this.http.put<ApplicationKey>(url, key);
  }

  /**
   * Delete application key
   */
  deleteApplicationKey(applicationId: string, keyMappingId: string): Observable<void> {
    const url = getApiUrl(`/applications/${applicationId}/oauth-keys/${keyMappingId}`);
    
    return this.http.delete<void>(url);
  }

  /**
   * Regenerate consumer secret
   */
  regenerateSecret(applicationId: string, keyMappingId: string): Observable<ApplicationKeyReGenerateResponse> {
    const url = getApiUrl(`/applications/${applicationId}/oauth-keys/${keyMappingId}/regenerate-secret`);
    
    return this.http.post<ApplicationKeyReGenerateResponse>(url, {});
  }

  /**
   * Clean up failed key generation
   */
  cleanUpKeys(applicationId: string, keyMappingId: string): Observable<void> {
    const url = getApiUrl(`/applications/${applicationId}/oauth-keys/${keyMappingId}/clean-up`);
    
    return this.http.post<void>(url, {});
  }

  // ========================================
  // Application Tokens
  // ========================================

  /**
   * Generate application token
   */
  generateToken(
    applicationId: string, 
    keyMappingId: string,
    request: ApplicationTokenGenerateRequest
  ): Observable<ApplicationToken> {
    const url = getApiUrl(`/applications/${applicationId}/oauth-keys/${keyMappingId}/generate-token`);
    
    return this.http.post<ApplicationToken>(url, request);
  }

  // ========================================
  // API Keys
  // ========================================

  /**
   * Generate API key for application
   */
  generateApiKey(
    applicationId: string, 
    keyType: 'PRODUCTION' | 'SANDBOX',
    validityPeriod?: number
  ): Observable<{ apikey: string; validityTime: number }> {
    const url = getApiUrl(`/applications/${applicationId}/api-keys/${keyType}/generate`);
    
    return this.http.post<{ apikey: string; validityTime: number }>(url, {
      validityPeriod: validityPeriod || -1 // -1 for unlimited
    });
  }

  /**
   * Revoke API key
   */
  revokeApiKey(
    applicationId: string, 
    keyType: 'PRODUCTION' | 'SANDBOX',
    apiKey: string
  ): Observable<void> {
    const url = getApiUrl(`/applications/${applicationId}/api-keys/${keyType}/revoke`);
    
    return this.http.post<void>(url, { apikey: apiKey });
  }

  // ========================================
  // Export/Import
  // ========================================

  /**
   * Export application
   */
  exportApplication(applicationId: string, withKeys: boolean = false): Observable<Blob> {
    const url = getApiUrl(`/applications/export`);
    let params = new HttpParams()
      .set('appId', applicationId)
      .set('withKeys', withKeys.toString());

    return this.http.get(url, { params, responseType: 'blob' });
  }

  /**
   * Import application
   */
  importApplication(file: File, preserveOwner: boolean = false, skipSubscriptions: boolean = false): Observable<Application> {
    const url = getApiUrl(`/applications/import`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('preserveOwner', preserveOwner.toString());
    formData.append('skipSubscriptions', skipSubscriptions.toString());

    return this.http.post<Application>(url, formData);
  }
}
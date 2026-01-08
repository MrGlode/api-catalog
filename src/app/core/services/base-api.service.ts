import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { ApiError } from '../../models';

/**
 * Options pour les requêtes HTTP
 */
export interface RequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}

/**
 * Service de base abstrait pour toutes les requêtes API
 * Fournit les méthodes HTTP communes avec gestion d'erreurs
 */
@Injectable()
export abstract class BaseApiService {
  /**
   * URL de base de l'API Devportal
   */
  protected readonly baseUrl: string;

  constructor(
    protected http: HttpClient,
    protected config: ConfigService
  ) {
    this.baseUrl = config.devportalApiUrl;
  }

  /**
   * Effectue une requête GET
   * @param endpoint - Endpoint de l'API (ex: '/apis')
   * @param options - Options de la requête
   * @returns Observable de la réponse
   */
  protected get<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);

    return this.http.get<T>(url, httpOptions).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    ) as Observable<T>;
  }

  /**
   * Effectue une requête POST
   * @param endpoint - Endpoint de l'API
   * @param body - Corps de la requête
   * @param options - Options de la requête
   * @returns Observable de la réponse
   */
  protected post<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);

    return this.http.post<T>(url, body, httpOptions).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    ) as Observable<T>;
  }

  /**
   * Effectue une requête PUT
   * @param endpoint - Endpoint de l'API
   * @param body - Corps de la requête
   * @param options - Options de la requête
   * @returns Observable de la réponse
   */
  protected put<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);

    return this.http.put<T>(url, body, httpOptions).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    ) as Observable<T>;
  }

  /**
   * Effectue une requête DELETE
   * @param endpoint - Endpoint de l'API
   * @param options - Options de la requête
   * @returns Observable de la réponse
   */
  protected delete<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);

    return this.http.delete<T>(url, httpOptions).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    ) as Observable<T>;
  }

  /**
   * Construit l'URL complète
   * @param endpoint - Endpoint relatif
   * @returns URL complète
   */
  protected buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  /**
   * Construit les options HTTP avec les headers par défaut
   * @param options - Options personnalisées
   * @returns Options HTTP complètes
   */
  protected buildHttpOptions(options?: RequestOptions): any {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Ajouter le tenant si configuré
    if (this.config.tenant) {
      headers = headers.set('X-WSO2-Tenant', this.config.tenant);
    }

    // Fusionner avec les headers personnalisés
    if (options?.headers) {
      const customHeaders = options.headers instanceof HttpHeaders 
        ? options.headers 
        : new HttpHeaders(options.headers);
      
      customHeaders.keys().forEach(key => {
        const value = customHeaders.get(key);
        if (value) {
          headers = headers.set(key, value);
        }
      });
    }

    const httpOptions: any = {
      headers,
      params: options?.params
    };

    // N'ajouter responseType que s'il est explicitement fourni
    if (options?.responseType) {
      httpOptions.responseType = options.responseType;
    }

    return httpOptions;
  }

  /**
   * Construit les paramètres de pagination
   * @param limit - Nombre maximum d'éléments
   * @param offset - Offset pour la pagination
   * @returns HttpParams avec pagination
   */
  protected buildPaginationParams(limit?: number, offset?: number): HttpParams {
    let params = new HttpParams();

    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }

    if (offset !== undefined) {
      params = params.set('offset', offset.toString());
    }

    return params;
  }

  /**
   * Gère les erreurs HTTP
   * @param error - Erreur HTTP
   * @returns Observable d'erreur
   */
  protected handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;
    let apiError: ApiError | undefined;

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      apiError = error.error as ApiError;
      
      if (apiError?.message) {
        errorMessage = apiError.message;
      } else {
        errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }

      // Journaliser les détails pour le debug
      if (!this.config.isProduction) {
        console.error('Erreur API:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          error: apiError
        });
      }
    }

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: apiError
    }));
  }

  /**
   * Construit les paramètres de requête depuis un objet
   * @param params - Objet avec les paramètres
   * @returns HttpParams
   */
  protected buildQueryParams(params: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();

    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return httpParams;
  }
}
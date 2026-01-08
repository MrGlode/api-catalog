import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, timer } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { TokenResponse } from '../../models';

/**
 * Interface pour les informations décodées du JWT
 */
interface JwtPayload {
  sub: string;           // Subject (username)
  exp: number;           // Expiration timestamp
  iat: number;           // Issued at timestamp
  scope: string;         // Scopes
  [key: string]: any;    // Autres propriétés
}

/**
 * Service d'authentification
 * Gère l'authentification OAuth2/JWT avec WSO2 API Manager
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'wso2_access_token';
  private readonly REFRESH_TOKEN_KEY = 'wso2_refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'wso2_token_expiry';

  /**
   * Observable du statut d'authentification
   */
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  /**
   * Observable de l'utilisateur courant
   */
  private currentUserSubject = new BehaviorSubject<string | null>(this.getCurrentUsername());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {
    // Démarrer le timer de refresh du token si connecté
    if (this.hasValidToken()) {
      this.scheduleTokenRefresh();
    }
  }

  /**
   * Authentification avec username et password
   * @param username - Nom d'utilisateur
   * @param password - Mot de passe
   * @returns Observable du token
   */
  login(username: string, password: string): Observable<TokenResponse> {
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('username', username)
      .set('password', password)
      .set('scope', this.config.scopes);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + this.getBasicAuthHeader()
    });

    return this.http.post<any>(this.config.tokenUrl, body.toString(), { headers }).pipe(
      map(response => this.mapTokenResponse(response)),
      tap(token => this.handleSuccessfulAuth(token)),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => new Error('Échec de l\'authentification'));
      })
    );
  }

  /**
   * Rafraîchir le token d'accès
   * @returns Observable du nouveau token
   */
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('Aucun refresh token disponible'));
    }

    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + this.getBasicAuthHeader()
    });

    return this.http.post<any>(this.config.tokenUrl, body.toString(), { headers }).pipe(
      map(response => this.mapTokenResponse(response)),
      tap(token => this.handleSuccessfulAuth(token)),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.logout();
        return throwError(() => new Error('Échec du rafraîchissement du token'));
      })
    );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Récupère le token d'accès
   * @returns Token d'accès ou null
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Récupère le refresh token
   * @returns Refresh token ou null
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns true si un token valide existe
   */
  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  /**
   * Récupère le nom d'utilisateur depuis le JWT
   * @returns Nom d'utilisateur ou null
   */
  getCurrentUsername(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = this.decodeJwt(token);
      return payload.sub || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Vérifie si le token est expiré ou va expirer bientôt
   * @returns true si le token est valide
   */
  private hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return false;

    const expiry = parseInt(expiryTime, 10);
    const now = Date.now() / 1000;
    
    // Vérifier si le token expire dans moins de 5 minutes (buffer)
    return expiry > (now + this.config.tokenExpirationBuffer);
  }

  /**
   * Gère une authentification réussie
   * @param token - Réponse du token
   */
  private handleSuccessfulAuth(token: TokenResponse): void {
    localStorage.setItem(this.TOKEN_KEY, token.accessToken);
    
    if (token.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token.refreshToken);
    }

    const expiryTime = Math.floor(Date.now() / 1000) + token.expiresIn;
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(this.getCurrentUsername());

    // Planifier le refresh du token
    this.scheduleTokenRefresh();
  }

  /**
   * Planifie le rafraîchissement automatique du token
   */
  private scheduleTokenRefresh(): void {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return;

    const expiry = parseInt(expiryTime, 10);
    const now = Date.now() / 1000;
    const timeUntilRefresh = (expiry - now - this.config.tokenExpirationBuffer) * 1000;

    if (timeUntilRefresh > 0) {
      timer(timeUntilRefresh).pipe(
        switchMap(() => this.refreshToken())
      ).subscribe({
        next: () => console.log('Token rafraîchi automatiquement'),
        error: (err) => console.error('Erreur lors du refresh automatique:', err)
      });
    }
  }

  /**
   * Décode un JWT sans vérification de signature
   * @param token - Token JWT
   * @returns Payload décodé
   */
  private decodeJwt(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token JWT invalide');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  /**
   * Génère le header Basic Auth pour OAuth2
   * @returns Header Basic Auth encodé en base64
   */
  private getBasicAuthHeader(): string {
    const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
    return btoa(credentials);
  }

  /**
   * Mappe la réponse de l'API vers notre interface TokenResponse
   * @param response - Réponse brute de l'API
   * @returns TokenResponse normalisé
   */
  private mapTokenResponse(response: any): TokenResponse {
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      scope: response.scope,
      tokenType: response.token_type,
      expiresIn: response.expires_in
    };
  }
}
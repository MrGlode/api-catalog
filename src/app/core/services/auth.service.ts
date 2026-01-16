/**
 * WSO2 Authentication Service
 * Handles OAuth2 authentication with WSO2 API Manager
 */
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { environment, getOAuthUrl } from '../../../environments/environment';
import { 
  DCRRequest, 
  DCRResponse, 
  TokenResponse, 
  AuthState, 
  LoginCredentials,
  UserInfo 
} from '../models';

const AUTH_STORAGE_KEY = 'wso2_auth_state';
const DCR_STORAGE_KEY = 'wso2_dcr_client';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false
  });

  // Public observables
  authState$ = this.authState.asObservable();
  isAuthenticated$ = this.authState$.pipe(map(state => state.isAuthenticated));
  user$ = this.authState$.pipe(map(state => state.user));
  
  // Username as string observable (for components expecting string | null)
  currentUser$: Observable<string | null> = this.user$.pipe(
    map(user => {
      if (!user) return null;
      return user.preferred_username || user.name || user.sub || null;
    })
  );

  // Signals for modern Angular
  isAuthenticated = signal(false);
  currentUser = signal<UserInfo | null>(null);

  constructor(private http: HttpClient) {
    this.loadStoredAuth();
  }

  /**
   * Load stored authentication state
   */
  private loadStoredAuth(): void {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const state: AuthState = JSON.parse(stored);
        
        // Check if token is still valid
        if (state.expiresAt && state.expiresAt > Date.now()) {
          this.authState.next(state);
          this.isAuthenticated.set(state.isAuthenticated);
          this.currentUser.set(state.user || null);
        } else if (state.refreshToken) {
          // Try to refresh token
          this.refreshToken(state.refreshToken).subscribe();
        }
      }
    } catch (e) {
      console.error('Failed to load stored auth state', e);
    }
  }

  /**
   * Save authentication state
   */
  private saveAuthState(state: AuthState): void {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
    this.authState.next(state);
    this.isAuthenticated.set(state.isAuthenticated);
    this.currentUser.set(state.user || null);
  }

  /**
   * Get stored DCR client credentials
   */
  private getStoredDCRClient(): DCRResponse | null {
    try {
      const stored = localStorage.getItem(DCR_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save DCR client credentials
   */
  private saveDCRClient(client: DCRResponse): void {
    localStorage.setItem(DCR_STORAGE_KEY, JSON.stringify(client));
  }

  /**
   * Register DCR application (Dynamic Client Registration)
   */
  registerDCRApplication(adminUsername: string, adminPassword: string): Observable<DCRResponse> {
    const url = `${environment.wso2.baseUrl}${environment.wso2.oauth.dcrEndpoint}`;
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${adminUsername}:${adminPassword}`)
    });

    const body: DCRRequest = {
      clientName: environment.wso2.dcr.clientName,
      grantType: environment.wso2.dcr.grantTypes,
      callbackUrl: environment.wso2.dcr.callbackUrl,
      saasApp: true,
      owner: adminUsername
    };

    return this.http.post<DCRResponse>(url, body, { headers }).pipe(
      tap(response => this.saveDCRClient(response)),
      catchError(error => {
        console.error('DCR registration failed', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Login with username and password
   * Supports both: login(credentials) and login(username, password)
   */
  login(credentialsOrUsername: LoginCredentials | string, password?: string): Observable<AuthState> {
    const dcrClient = this.getStoredDCRClient();
    
    if (!dcrClient) {
      return throwError(() => new Error('DCR client not registered. Please register first.'));
    }

    // Support both signatures
    let username: string;
    let pwd: string;
    
    if (typeof credentialsOrUsername === 'string') {
      username = credentialsOrUsername;
      pwd = password!;
    } else {
      username = credentialsOrUsername.username;
      pwd = credentialsOrUsername.password;
    }

    return this.getToken(
      dcrClient.clientId,
      dcrClient.clientSecret,
      username,
      pwd
    );
  }

  /**
   * Get OAuth2 token
   */
  private getToken(clientId: string, clientSecret: string, username: string, password: string ): Observable<AuthState> {
    const url = getOAuthUrl('tokenEndpoint');
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    });

    const scopes = Object.values(environment.wso2.scopes).join(' ');
    
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('username', username)
      .set('password', password)
      .set('scope', scopes);

    return this.http.post<TokenResponse>(url, body.toString(), { headers }).pipe(
      map(response => this.createAuthState(response, clientId, clientSecret)),
      tap(state => this.saveAuthState(state)),
      switchMap(state => this.fetchUserInfo(state)),
      catchError(error => {
        console.error('Token request failed', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh access token
   * Can be called without argument (uses stored refresh token) or with explicit token
   */
  refreshToken(refreshTokenParam?: string): Observable<AuthState> {
    const dcrClient = this.getStoredDCRClient();
    
    if (!dcrClient) {
      return throwError(() => new Error('DCR client not found'));
    }

    // Use provided token or get from stored state
    const tokenToUse = refreshTokenParam || this.authState.getValue().refreshToken;
    
    if (!tokenToUse) {
      return throwError(() => new Error('No refresh token available'));
    }

    const url = getOAuthUrl('tokenEndpoint');
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${dcrClient.clientId}:${dcrClient.clientSecret}`)
    });

    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', tokenToUse);

    return this.http.post<TokenResponse>(url, body.toString(), { headers }).pipe(
      map(response => this.createAuthState(response, dcrClient.clientId, dcrClient.clientSecret)),
      tap(state => this.saveAuthState(state)),
      catchError(error => {
        console.error('Token refresh failed', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Fetch user info from OAuth2 userinfo endpoint
   */
  private fetchUserInfo(state: AuthState): Observable<AuthState> {
    if (!state.accessToken) {
      return of(state);
    }

    const url = getOAuthUrl('userinfoEndpoint');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${state.accessToken}`
    });

    return this.http.get<UserInfo>(url, { headers }).pipe(
      map(userInfo => ({
        ...state,
        user: userInfo
      })),
      tap(updatedState => this.saveAuthState(updatedState)),
      catchError(() => of(state)) // If userinfo fails, continue with existing state
    );
  }

  /**
   * Create auth state from token response
   */
  private createAuthState(
    tokenResponse: TokenResponse,
    clientId: string,
    clientSecret: string
  ): AuthState {
    return {
      isAuthenticated: true,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
      clientId,
      clientSecret
    };
  }

  /**
   * Logout
   */
  logout(): void {
    const state = this.authState.getValue();
    
    // Optionally revoke token
    if (state.accessToken) {
      this.revokeToken(state.accessToken).subscribe({
        error: () => {} // Ignore revoke errors
      });
    }

    // Clear state
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.authState.next({ isAuthenticated: false });
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  /**
   * Revoke token
   */
  private revokeToken(token: string): Observable<void> {
    const dcrClient = this.getStoredDCRClient();
    if (!dcrClient) {
      return of(void 0);
    }

    const url = getOAuthUrl('revokeEndpoint');
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${dcrClient.clientId}:${dcrClient.clientSecret}`)
    });

    const body = new HttpParams().set('token', token);

    return this.http.post<void>(url, body.toString(), { headers });
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | undefined {
    return this.authState.getValue().accessToken;
  }

  /**
   * Check if token needs refresh (5 minutes before expiry)
   */
  shouldRefreshToken(): boolean {
    const state = this.authState.getValue();
    if (!state.expiresAt) return false;
    
    const fiveMinutes = 5 * 60 * 1000;
    return state.expiresAt - Date.now() < fiveMinutes;
  }

  /**
   * Get current auth state
   */
  getCurrentState(): AuthState {
    return this.authState.getValue();
  }

  /**
   * Get current username
   */
  getCurrentUsername(): string | undefined {
    const user = this.currentUser();
    return user?.preferred_username || user?.name || user?.sub;
  }

  /**
   * Get refresh token from current state
   */
  getRefreshToken(): string | undefined {
    return this.authState.getValue().refreshToken;
  }
}
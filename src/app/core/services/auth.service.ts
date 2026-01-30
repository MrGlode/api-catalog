/**
 * WSO2 Authentication Service (BFF Version)
 * 
 * Handles OAuth2 authentication through the Backend-For-Frontend server.
 * Client secrets are NEVER exposed to the frontend.
 * 
 * Security improvements:
 * - No client secrets in frontend code
 * - Refresh tokens stored in httpOnly cookies (handled by BFF)
 * - Only access tokens are stored client-side
 */
import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { 
  TokenResponse, 
  AuthState, 
  LoginCredentials,
  UserInfo 
} from '../models';

const AUTH_STORAGE_KEY = 'wso2_auth_state';

/**
 * BFF Token Response (differs from direct WSO2 response)
 * Note: refresh_token is NOT included - it's in httpOnly cookie
 */
interface BffTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * Stored auth state (no secrets!)
 */
interface SecureAuthState {
  isAuthenticated: boolean;
  accessToken?: string;
  expiresAt?: number;
  user?: UserInfo;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false
  });

  // BFF API base path
  private readonly bffAuthUrl = '/api/auth';

  // Public observables
  authState$ = this.authState.asObservable();
  isAuthenticated$ = this.authState$.pipe(map(state => state.isAuthenticated));
  user$ = this.authState$.pipe(map(state => state.user));
  
  // Username as string observable
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

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Load stored authentication state from localStorage
   * Note: Only access token is stored, not refresh token
   */
  private loadStoredAuth(): void {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const state: SecureAuthState = JSON.parse(stored);
        
        // Check if token is still valid
        if (state.expiresAt && state.expiresAt > Date.now()) {
          this.updateAuthState({
            isAuthenticated: true,
            accessToken: state.accessToken,
            expiresAt: state.expiresAt,
            user: state.user
          });
        } else {
          // Token expired - try to refresh via BFF
          this.refreshToken().subscribe({
            error: () => this.clearAuthState()
          });
        }
      }
    } catch (e) {
      console.error('Failed to load stored auth state', e);
      this.clearAuthState();
    }
  }

  /**
   * Update auth state in memory and localStorage
   */
  private updateAuthState(state: AuthState): void {
    // Save to localStorage (without secrets)
    const secureState: SecureAuthState = {
      isAuthenticated: state.isAuthenticated,
      accessToken: state.accessToken,
      expiresAt: state.expiresAt,
      user: state.user
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(secureState));
    
    // Update BehaviorSubject
    this.authState.next(state);
    
    // Update signals
    this.isAuthenticated.set(state.isAuthenticated);
    this.currentUser.set(state.user || null);
  }

  /**
   * Clear auth state
   */
  private clearAuthState(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.authState.next({ isAuthenticated: false });
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  /**
   * Create auth state from BFF token response
   */
  private createAuthStateFromToken(tokenResponse: BffTokenResponse): AuthState {
    return {
      isAuthenticated: true,
      accessToken: tokenResponse.access_token,
      expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
    };
  }

  // ===========================================================================
  // PUBLIC METHODS
  // ===========================================================================

  /**
   * Login with username and password
   * 
   * @param credentials - Login credentials or username string
   * @param password - Password (if first param is username string)
   */
  login(credentialsOrUsername: LoginCredentials | string, password?: string): Observable<AuthState> {
    let username: string;
    let pwd: string;
    
    if (typeof credentialsOrUsername === 'string') {
      username = credentialsOrUsername;
      pwd = password!;
    } else {
      username = credentialsOrUsername.username;
      pwd = credentialsOrUsername.password;
    }

    return this.http.post<BffTokenResponse>(
      `${this.bffAuthUrl}/login`,
      { username, password: pwd },
      { withCredentials: true } // Important: Send/receive cookies
    ).pipe(
      map(response => this.createAuthStateFromToken(response)),
      tap(state => this.updateAuthState(state)),
      switchMap(state => this.fetchUserInfo(state)),
      catchError(error => {
        console.error('Login failed', error);
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh access token
   * Uses httpOnly cookie managed by BFF
   */
  refreshToken(): Observable<AuthState> {
    return this.http.post<BffTokenResponse>(
      `${this.bffAuthUrl}/refresh`,
      {},
      { withCredentials: true } // Important: Send cookies
    ).pipe(
      map(response => this.createAuthStateFromToken(response)),
      tap(state => this.updateAuthState(state)),
      catchError(error => {
        console.error('Token refresh failed', error);
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout - clears local state and revokes tokens via BFF
   */
  logout(): void {
    const accessToken = this.getAccessToken();
    
    // Call BFF logout endpoint
    const headers = accessToken 
      ? new HttpHeaders({ 'Authorization': `Bearer ${accessToken}` })
      : new HttpHeaders();

    this.http.post(
      `${this.bffAuthUrl}/logout`,
      {},
      { headers, withCredentials: true }
    ).subscribe({
      error: (err) => console.warn('Logout request failed', err)
    });

    // Clear local state immediately
    this.clearAuthState();
  }

  /**
   * Fetch user info from BFF
   */
  private fetchUserInfo(state: AuthState): Observable<AuthState> {
    if (!state.accessToken) {
      return of(state);
    }

    return this.http.get<UserInfo>(
      `${this.bffAuthUrl}/userinfo`,
      {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${state.accessToken}`
        })
      }
    ).pipe(
      map(userInfo => ({
        ...state,
        user: userInfo
      })),
      tap(updatedState => this.updateAuthState(updatedState)),
      catchError(() => of(state)) // Continue with existing state if userinfo fails
    );
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
   * Check authentication status via BFF
   * Useful on app init to check if refresh token cookie exists
   */
  checkAuthStatus(): Observable<boolean> {
    return this.http.get<{ authenticated: boolean }>(
      `${this.bffAuthUrl}/status`,
      { withCredentials: true }
    ).pipe(
      map(response => response.authenticated),
      catchError(() => of(false))
    );
  }

  // ===========================================================================
  // DEPRECATED METHODS (for backward compatibility)
  // ===========================================================================

  /**
   * @deprecated DCR is now handled server-side
   */
  registerDCRApplication(_adminUsername: string, _adminPassword: string): Observable<any> {
    console.warn('registerDCRApplication is deprecated - DCR is now handled by BFF server');
    return throwError(() => new Error('DCR registration is handled server-side'));
  }

  /**
   * @deprecated No longer needed - refresh token is in httpOnly cookie
   */
  getRefreshToken(): string | undefined {
    console.warn('getRefreshToken is deprecated - refresh token is managed by BFF via httpOnly cookie');
    return undefined;
  }
}
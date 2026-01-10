/**
 * WSO2 Auth Interceptor
 * Automatically adds authentication token to API requests
 * Uses functional interceptor pattern for Angular 17+
 */
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Check if URL is a WSO2 API URL
 */
function isWso2ApiUrl(url: string): boolean {
  return url.startsWith(environment.wso2.baseUrl);
}

/**
 * Check if URL is an OAuth endpoint (should not add bearer token)
 */
function isOAuthEndpoint(url: string): boolean {
  const oauthPaths = [
    environment.wso2.oauth.tokenEndpoint,
    environment.wso2.oauth.dcrEndpoint,
    environment.wso2.oauth.revokeEndpoint,
  ];
  
  return oauthPaths.some(path => url.includes(path));
}

/**
 * Auth interceptor function
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  // Skip if not a WSO2 API URL
  if (!isWso2ApiUrl(req.url)) {
    return next(req);
  }

  // Skip OAuth endpoints (they use Basic auth)
  if (isOAuthEndpoint(req.url)) {
    return next(req);
  }

  // Get access token
  const token = authService.getAccessToken();

  // If no token, proceed without auth header
  if (!token) {
    return next(req);
  }

  // Check if token needs refresh
  if (authService.shouldRefreshToken()) {
    const state = authService.getCurrentState();
    
    if (state.refreshToken) {
      return authService.refreshToken(state.refreshToken).pipe(
        switchMap(newState => {
          const authReq = addAuthHeader(req, newState.accessToken!);
          return next(authReq);
        }),
        catchError(error => {
          // If refresh fails, try with existing token
          const authReq = addAuthHeader(req, token);
          return next(authReq);
        })
      );
    }
  }

  // Add auth header
  const authReq = addAuthHeader(req, token);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401) {
        const state = authService.getCurrentState();
        
        // Try to refresh token
        if (state.refreshToken) {
          return authService.refreshToken(state.refreshToken).pipe(
            switchMap(newState => {
              const retryReq = addAuthHeader(req, newState.accessToken!);
              return next(retryReq);
            }),
            catchError(refreshError => {
              // Refresh failed, logout
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        } else {
          // No refresh token, logout
          authService.logout();
        }
      }
      
      return throwError(() => error);
    })
  );
};

/**
 * Add Authorization header to request
 */
function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Error interceptor for handling API errors
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Une erreur est survenue';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Erreur: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Requête invalide';
            break;
          case 401:
            errorMessage = 'Non authentifié';
            break;
          case 403:
            errorMessage = 'Accès refusé';
            break;
          case 404:
            errorMessage = 'Ressource non trouvée';
            break;
          case 409:
            errorMessage = error.error?.message || 'Conflit';
            break;
          case 500:
            errorMessage = 'Erreur serveur';
            break;
          default:
            errorMessage = error.error?.message || `Erreur ${error.status}`;
        }
      }

      console.error('HTTP Error:', errorMessage, error);
      
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        details: error.error
      }));
    })
  );
};
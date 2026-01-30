/**
 * WSO2 Auth Interceptor (BFF Version)
 * 
 * Automatically adds authentication token to API requests.
 * Handles token refresh via BFF when token is about to expire.
 * 
 * Uses functional interceptor pattern for Angular 17+
 */
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Paths that should NOT have Bearer token added
 * (BFF auth endpoints use cookies, not bearer tokens)
 */
const EXCLUDED_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/register',
  '/api/check-username',
];

/**
 * Paths that are WSO2 API paths (need auth)
 */
const WSO2_API_PATHS = [
  '/api/am/devportal',
];

/**
 * Check if URL should have auth header added
 */
function shouldAddAuthHeader(url: string): boolean {
  // Exclude auth endpoints
  if (EXCLUDED_PATHS.some(path => url.includes(path))) {
    return false;
  }
  
  // Include WSO2 API paths
  if (WSO2_API_PATHS.some(path => url.includes(path))) {
    return true;
  }
  
  return false;
}

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
 * Auth interceptor function
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  // Skip if URL doesn't need auth
  if (!shouldAddAuthHeader(req.url)) {
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
    return authService.refreshToken().pipe(
      switchMap(newState => {
        const authReq = addAuthHeader(req, newState.accessToken!);
        return next(authReq);
      }),
      catchError(error => {
        // If refresh fails, try with existing token anyway
        const authReq = addAuthHeader(req, token);
        return next(authReq);
      })
    );
  }

  // Add auth header
  const authReq = addAuthHeader(req, token);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401) {
        // Try to refresh token
        return authService.refreshToken().pipe(
          switchMap(newState => {
            const retryReq = addAuthHeader(req, newState.accessToken!);
            return next(retryReq);
          }),
          catchError(refreshError => {
            // Refresh failed - user needs to login again
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};

/**
 * Credentials interceptor - ensures cookies are sent with BFF requests
 * 
 * This interceptor adds withCredentials: true to BFF auth requests
 * so that httpOnly cookies (refresh tokens) are included.
 */
export const credentialsInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Add credentials to BFF auth requests
  if (req.url.includes('/api/auth/')) {
    const credReq = req.clone({
      withCredentials: true
    });
    return next(credReq);
  }
  
  return next(req);
};
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';

/**
 * Interceptor HTTP pour l'authentification JWT (Angular v20)
 * Converti de classe en fonction tout en gardant la logique complète
 * 
 * Fonctionnalités :
 * - Ajoute automatiquement le token d'accès à toutes les requêtes vers WSO2
 * - Gère le refresh automatique du token en cas d'expiration
 * - Gestion de la file d'attente des requêtes pendant le refresh
 */

// Variables partagées pour gérer l'état du refresh
// (Ces variables sont en dehors de la fonction pour persister entre les appels)
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<any>(null);

/**
 * JWT Interceptor Function pour Angular v20
 */
export const jwtInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  
  // Injection des services
  const authService = inject(AuthService);
  const config = inject(ConfigService);

  /**
   * Vérifie si la requête est vers l'API WSO2
   */
  const isWso2ApiRequest = (req: HttpRequest<any>): boolean => {
    return req.url.includes(config.baseUrl) ||
           req.url.includes(config.devportalApiUrl);
  };

  /**
   * Ajoute le token JWT à la requête
   */
  const addToken = (req: HttpRequest<any>): HttpRequest<any> => {
    const token = authService.getAccessToken();
    
    if (token) {
      return req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return req;
  };

  /**
   * Gère l'erreur 401 en tentant de rafraîchir le token
   */
  const handle401Error = (
    req: HttpRequest<any>,
    handler: HttpHandlerFn
  ): Observable<HttpEvent<any>> => {
    // Si on n'est pas déjà en train de rafraîchir le token
    if (!isRefreshing) {
      isRefreshing = true;
      refreshTokenSubject.next(null);

      return authService.refreshToken().pipe(
        switchMap((token) => {
          isRefreshing = false;
          refreshTokenSubject.next(token.accessToken);
          
          // Réessayer la requête originale avec le nouveau token
          return handler(addToken(req));
        }),
        catchError((err) => {
          isRefreshing = false;
          
          // Le refresh a échoué, déconnecter l'utilisateur
          authService.logout();
          
          return throwError(() => err);
        })
      );
    } else {
      // Attendre que le refresh soit terminé
      return refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => {
          return handler(addToken(req));
        })
      );
    }
  };

  // === LOGIQUE PRINCIPALE DE L'INTERCEPTEUR ===

  // Vérifier si la requête est vers l'API WSO2
  if (isWso2ApiRequest(request)) {
    // Ajouter le token si l'utilisateur est authentifié
    if (authService.isAuthenticated()) {
      request = addToken(request);
    }
  }

  // Exécuter la requête et gérer les erreurs
  return next(request).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse) {
        // Gérer l'erreur 401 (Unauthorized)
        if (error.status === 401 && isWso2ApiRequest(request)) {
          return handle401Error(request, next);
        }
      }
      return throwError(() => error);
    })
  );
};
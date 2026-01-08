import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';

/**
 * Interceptor HTTP pour l'authentification JWT
 * Ajoute automatiquement le token d'accès à toutes les requêtes vers WSO2
 * Gère le refresh automatique du token en cas d'expiration
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private config: ConfigService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Vérifier si la requête est vers l'API WSO2
    if (this.isWso2ApiRequest(request)) {
      // Ajouter le token si l'utilisateur est authentifié
      if (this.authService.isAuthenticated()) {
        request = this.addToken(request);
      }
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          // Gérer l'erreur 401 (Unauthorized)
          if (error.status === 401 && this.isWso2ApiRequest(request)) {
            return this.handle401Error(request, next);
          }
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifie si la requête est vers l'API WSO2
   * @param request - Requête HTTP
   * @returns true si c'est une requête WSO2
   */
  private isWso2ApiRequest(request: HttpRequest<any>): boolean {
    return request.url.includes(this.config.baseUrl) ||
           request.url.includes(this.config.devportalApiUrl);
  }

  /**
   * Ajoute le token JWT à la requête
   * @param request - Requête HTTP
   * @returns Requête clonée avec le token
   */
  private addToken(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getAccessToken();
    
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return request;
  }

  /**
   * Gère l'erreur 401 en tentant de rafraîchir le token
   * @param request - Requête HTTP originale
   * @param next - Handler suivant
   * @returns Observable de l'événement HTTP
   */
  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Si on n'est pas déjà en train de rafraîchir le token
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((token) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token.accessToken);
          
          // Réessayer la requête originale avec le nouveau token
          return next.handle(this.addToken(request));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          
          // Le refresh a échoué, déconnecter l'utilisateur
          this.authService.logout();
          
          return throwError(() => err);
        })
      );
    } else {
      // Attendre que le refresh soit terminé
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => {
          return next.handle(this.addToken(request));
        })
      );
    }
  }
}
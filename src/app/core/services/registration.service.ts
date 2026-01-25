/**
 * Registration Service
 * Gère l'inscription des nouveaux utilisateurs
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

export interface RegistrationData {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  organization?: string;
  phone?: string;
  country?: string;
}

export interface RegistrationResponse {
  success: boolean;
  message?: string;
  username?: string;
  error?: string;
  details?: string;
}

export interface UsernameCheckResponse {
  available: boolean;
  username: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  
  private readonly apiUrl = '/api';

  constructor(private http: HttpClient) {}

  /**
   * Inscrire un nouvel utilisateur
   */
  register(data: RegistrationData): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(`${this.apiUrl}/register`, data);
  }

  /**
   * Vérifier si un username est disponible
   */
  checkUsername(username: string): Observable<UsernameCheckResponse> {
    return this.http.post<UsernameCheckResponse>(`${this.apiUrl}/check-username`, { username });
  }

  /**
   * Vérifier disponibilité (retourne boolean)
   */
  isUsernameAvailable(username: string): Observable<boolean> {
    return this.checkUsername(username).pipe(
      map(response => response.available),
      catchError(() => of(false))
    );
  }

  /**
   * Valider le format email
   */
  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Valider le mot de passe (politique WSO2)
   */
  isValidPassword(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  }

  /**
   * Règles de validation du mot de passe
   */
  getPasswordRules(): { rule: string; test: (pwd: string) => boolean }[] {
    return [
      { rule: 'Au moins 8 caractères', test: (pwd) => pwd.length >= 8 },
      { rule: 'Une lettre majuscule', test: (pwd) => /[A-Z]/.test(pwd) },
      { rule: 'Une lettre minuscule', test: (pwd) => /[a-z]/.test(pwd) },
      { rule: 'Un chiffre', test: (pwd) => /\d/.test(pwd) },
      { rule: 'Un caractère spécial (@$!%*?&)', test: (pwd) => /[@$!%*?&]/.test(pwd) }
    ];
  }
}
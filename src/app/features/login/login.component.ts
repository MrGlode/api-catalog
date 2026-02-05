/**
 * Login Component
 * Handles user authentication via WSO2 API Manager
 */
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, AccountNotValidatedError } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="login-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1>Connexion</h1>
            <p>Connectez-vous pour accéder à vos applications et souscriptions</p>
          </div>

          <!-- Erreur classique (identifiants incorrects, etc.) -->
          @if (error() && !isAccountNotValidated()) {
            <div class="error-message">
              <span class="error-icon">⚠️</span>
              {{ error() }}
            </div>
          }

          <!-- Compte non validé — message d'avertissement distinct -->
          @if (isAccountNotValidated()) {
            <div class="warning-message">
              <span class="warning-icon">🔒</span>
              <div class="warning-content">
                <strong>Compte en attente de validation</strong>
                <p>{{ error() }}</p>
              </div>
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="login-form">
            <div class="form-group">
              <label for="username">Nom d'utilisateur</label>
              <input
                type="text"
                id="username"
                [(ngModel)]="username"
                name="username"
                placeholder="Entrez votre nom d'utilisateur"
                required
                [disabled]="loading()"
              />
            </div>

            <div class="form-group">
              <label for="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                placeholder="Entrez votre mot de passe"
                required
                [disabled]="loading()"
              />
            </div>

            <button type="submit" class="btn-login" [disabled]="loading() || !username || !password">
              @if (loading()) {
                <span class="spinner"></span>
                Connexion en cours...
              } @else {
                Se connecter
              }
            </button>
          </form>

          <div class="login-footer">
            <p>Pas encore de compte ? <a routerLink="/register">Créer un compte</a></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      padding: var(--spacing-xl) var(--spacing-lg);
    }

    .login-container {
      width: 100%;
      max-width: 420px;
    }

    .login-card {
      background: white;
      border-radius: var(--border-radius-xl);
      padding: var(--spacing-2xl);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-gray-200);
    }

    .login-header {
      text-align: center;
      margin-bottom: var(--spacing-xl);
    }

    .login-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: var(--color-primary-50);
      border-radius: var(--border-radius-lg);
      margin-bottom: var(--spacing-md);
      color: var(--color-primary-600);
      
      svg {
        width: 28px;
        height: 28px;
      }
    }

    .login-header h1 {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--spacing-xs) 0;
    }

    .login-header p {
      color: var(--color-gray-500);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    .error-message {
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: var(--spacing-md);
      border-radius: var(--border-radius-md);
      margin-bottom: var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: var(--font-size-sm);
    }

    .warning-message {
      background: #fef3c7;
      border: 1px solid #fde68a;
      color: #92400e;
      padding: var(--spacing-md);
      border-radius: var(--border-radius-md);
      margin-bottom: var(--spacing-lg);
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-sm);
      font-size: var(--font-size-sm);
    }

    .warning-icon {
      font-size: 1.25rem;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .warning-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .warning-content strong {
      font-weight: var(--font-weight-semibold, 600);
      color: #78350f;
    }

    .warning-content p {
      margin: 0;
      line-height: 1.4;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .form-group label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-700);
    }

    .form-group input {
      padding: var(--spacing-md);
      border: 1px solid var(--color-gray-300);
      border-radius: var(--border-radius-md);
      font-size: var(--font-size-base);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group input:disabled {
      background: var(--color-gray-100);
      cursor: not-allowed;
    }

    .btn-login {
      padding: var(--spacing-md) var(--spacing-lg);
      background: var(--color-primary-600);
      color: white;
      border: none;
      border-radius: var(--border-radius-md);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: background var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
    }

    .btn-login:hover:not(:disabled) {
      background: var(--color-primary-700);
    }

    .btn-login:disabled {
      background: var(--color-gray-400);
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .login-footer {
      text-align: center;
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--color-gray-100);
    }

    .login-footer p {
      color: var(--color-gray-500);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    .login-footer a {
      color: var(--color-primary-600);
      text-decoration: none;
      font-weight: var(--font-weight-medium);
    }

    .login-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  isAccountNotValidated = signal(false);

  private returnUrl = '/home';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Get return URL from query params
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/home';
    });
  }

  onSubmit(): void {
    if (!this.username || !this.password) return;

    this.loading.set(true);
    this.error.set(null);
    this.isAccountNotValidated.set(false);

    this.authService.login({
      username: this.username,
      password: this.password
    }).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.loading.set(false);

        // Détection du cas "compte non validé"
        if (err instanceof AccountNotValidatedError) {
          this.isAccountNotValidated.set(true);
          this.error.set(err.message);
        } else {
          this.isAccountNotValidated.set(false);
          this.error.set(err.message || 'Échec de la connexion. Vérifiez vos identifiants.');
        }
      }
    });
  }
}
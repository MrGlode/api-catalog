import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../core/services/auth.service';
import { ConfigService } from '../../core/services/config.service';
import { firstValueFrom } from 'rxjs';

/**
 * Composant de connexion avec WSO2 OAuth2 Password Grant
 * Inclut un mode test pour le développement
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  animations: [
    // Animation fadeInOut pour les alertes
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit {
  /**
   * Formulaire de connexion
   */
  loginForm!: FormGroup;

  /**
   * État de chargement
   */
  isLoading = false;

  /**
   * Message d'erreur
   */
  errorMessage = '';

  /**
   * Message de succès
   */
  successMessage = '';

  /**
   * URL de retour après connexion
   */
  returnUrl = '/home';

  /**
   * Mode test activé
   */
  isTestMode = false; // Mettre à false en production

  /**
   * Afficher/masquer le mot de passe
   */
  showPassword = false;

  /**
   * Utilisateurs de test
   */
  testUsers = [
    {
      username: 'admin',
      password: 'admin123',
      role: 'Administrator',
      name: 'Admin User',
      email: 'admin@example.com',
      permissions: ['api.read', 'api.write', 'api.admin']
    },
    {
      username: 'developer',
      password: 'dev123',
      role: 'Developer',
      name: 'John Developer',
      email: 'john.dev@example.com',
      permissions: ['api.read', 'api.subscribe']
    },
    {
      username: 'user',
      password: 'user123',
      role: 'User',
      name: 'Jane User',
      email: 'jane.user@example.com',
      permissions: ['api.read']
    }
  ];

  /**
   * Animation state
   */
  animationState = 'initial';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    // Initialiser le formulaire
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      rememberMe: [false]
    });

    // Récupérer l'URL de retour
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Vérifier si déjà connecté
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate([this.returnUrl]);
      }
    });

    // Afficher un message si présent dans les query params
    const message = this.route.snapshot.queryParams['message'];
    if (message) {
      this.successMessage = message;
    }

    // Lancer l'animation d'entrée
    setTimeout(() => {
      this.animationState = 'loaded';
    }, 100);

    // En mode test, pré-remplir avec un compte de démo
    if (this.isTestMode) {
      this.prefillTestCredentials();
    }
  }

  /**
   * Pré-remplir avec des credentials de test
   */
  prefillTestCredentials(): void {
    this.loginForm.patchValue({
      username: 'developer',
      password: 'dev123'
    });
  }

  /**
   * Soumettre le formulaire
   */
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { username, password, rememberMe } = this.loginForm.value;

    try {
      if (this.isTestMode) {
        // Mode test : authentification simulée
        await this.testLogin(username, password, rememberMe);
      } else {
        // Mode production : authentification WSO2 réelle
        await this.wso2Login(username, password, rememberMe);
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Erreur de connexion';
      this.isLoading = false;
    }
  }

  /**
   * Connexion en mode test
   */
  private async testLogin(username: string, password: string, rememberMe: boolean): Promise<void> {
    // Simuler un délai réseau
    await this.delay(1000);

    // Vérifier les credentials de test
    const testUser = this.testUsers.find(
      u => u.username === username && u.password === password
    );

    if (!testUser) {
      throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
    }

    // Créer un token JWT factice
    const mockToken = this.createMockJwtToken(testUser);
    
    // Créer la réponse du token comme attendue par AuthService
    const mockTokenResponse = {
      access_token: mockToken,
      refresh_token: 'mock_refresh_token_' + Date.now(),
      expires_in: 3600,
      token_type: 'Bearer',
      scope: testUser.permissions.join(' ')
    };

    // Stocker directement dans localStorage comme le fait handleSuccessfulAuth
    localStorage.setItem('wso2_access_token', mockTokenResponse.access_token);
    localStorage.setItem('wso2_refresh_token', mockTokenResponse.refresh_token);
    const expiryTime = Math.floor(Date.now() / 1000) + mockTokenResponse.expires_in;
    localStorage.setItem('wso2_token_expiry', expiryTime.toString());

    // Forcer la mise à jour de l'état d'authentification
    // On recharge la page pour que l'AuthService détecte le token
    this.successMessage = `Bienvenue ${testUser.name} ! (Mode Test)`;

    // Redirection après un court délai
    setTimeout(() => {
      window.location.href = this.returnUrl; // Recharge complète pour réinitialiser l'AuthService
    }, 1500);

    this.isLoading = false;
  }

  /**
   * Créer un faux JWT token pour le mode test
   */
  private createMockJwtToken(user: any): string {
    // Header
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    // Payload
    const payload = {
      sub: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      scope: user.permissions.join(' '),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    // Encoder en base64url
    const base64UrlEncode = (obj: any): string => {
      return btoa(JSON.stringify(obj))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    };

    // Construire le token (sans signature réelle)
    const token = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.mock-signature`;
    return token;
  }

  /**
   * Connexion WSO2 réelle (Password Grant)
   */
  private async wso2Login(username: string, password: string, rememberMe: boolean): Promise<void> {
    try {
      // Utiliser la méthode login de AuthService qui retourne un Observable
      const response = await firstValueFrom(
        this.authService.login(username, password)
      );
      
      // AuthService gère automatiquement le stockage du token via handleSuccessfulAuth
      // Donc on n'a rien à faire ici, juste afficher le succès et rediriger
      
      // Récupérer le nom d'utilisateur
      const currentUsername = this.authService.getCurrentUsername();
      
      // Message de succès
      this.successMessage = `Bienvenue ${currentUsername || username} !`;

      // Redirection après un court délai
      setTimeout(() => {
        this.router.navigate([this.returnUrl]);
      }, 1500);
      
    } catch (error: any) {
      console.error('Erreur de connexion WSO2:', error);
      throw new Error(error.message || 'Erreur de connexion au serveur WSO2');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Basculer l'affichage du mot de passe
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Basculer le mode test
   */
  toggleTestMode(): void {
    this.isTestMode = !this.isTestMode;
    
    if (this.isTestMode) {
      this.prefillTestCredentials();
      this.successMessage = 'Mode test activé - Utilisez les credentials de démo';
    } else {
      this.loginForm.reset();
      this.successMessage = 'Mode production activé - Connexion WSO2';
    }
  }

  /**
   * Obtenir le message d'erreur pour un champ
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (field?.hasError('required') && field?.touched) {
      return `Le ${fieldName === 'username' ? 'nom d\'utilisateur' : 'mot de passe'} est requis`;
    }
    
    if (field?.hasError('minlength') && field?.touched) {
      return `Minimum 3 caractères requis`;
    }
    
    return '';
  }

  /**
   * Marquer tous les champs comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Utilitaire de délai
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Navigation vers la page d'inscription
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  /**
   * Navigation vers la réinitialisation du mot de passe
   */
  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  /**
   * Obtenir l'info-bulle pour le mode test
   */
  getTestModeTooltip(): string {
    if (this.isTestMode) {
      return 'Mode test activé\nComptes disponibles:\n- admin/admin123\n- developer/dev123\n- user/user123';
    }
    return 'Activer le mode test pour utiliser des comptes de démo';
  }
}
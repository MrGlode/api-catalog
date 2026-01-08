import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Composant pour la page 403 - Accès interdit
 * 
 * Affiché quand :
 * - L'utilisateur n'a pas les permissions nécessaires
 * - Une ressource nécessite un rôle spécifique
 * - L'accès à une API est restreint
 * 
 * @standalone
 */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './forbidden.component.html',
  styleUrl: './forbidden.component.scss'
})
export class ForbiddenComponent implements OnInit {
  /**
   * Ressource tentée d'accès
   */
  attemptedResource: string = '';

  /**
   * Raison du refus
   */
  forbiddenReason: string = '';

  /**
   * Permissions requises
   */
  requiredPermissions: string[] = [];

  /**
   * État d'authentification
   */
  isAuthenticated = false;

  /**
   * Informations utilisateur
   */
  currentUser: any = null;

  /**
   * Actions suggérées
   */
  suggestedActions = [
    {
      icon: '🔑',
      title: 'Demander l\'accès',
      description: 'Contactez votre administrateur pour obtenir les permissions nécessaires',
      action: 'request-access',
      requiresAuth: true
    },
    {
      icon: '👤',
      title: 'Se connecter avec un autre compte',
      description: 'Utilisez un compte ayant les permissions appropriées',
      action: 'switch-account',
      requiresAuth: false
    },
    {
      icon: '📧',
      title: 'Contacter le support',
      description: 'Notre équipe peut vous aider à résoudre ce problème',
      action: 'contact-support',
      requiresAuth: false
    },
    {
      icon: '📚',
      title: 'Consulter la documentation',
      description: 'Apprenez-en plus sur les niveaux d\'accès et permissions',
      action: 'view-docs',
      requiresAuth: false
    }
  ];

  /**
   * FAQ sur les accès
   */
  faqItems = [
    {
      question: 'Pourquoi je n\'ai pas accès ?',
      answer: 'L\'accès peut être restreint selon votre rôle, votre organisation ou le niveau de votre souscription.',
      expanded: false
    },
    {
      question: 'Comment obtenir l\'accès ?',
      answer: 'Contactez votre administrateur système ou soumettez une demande d\'accès via votre dashboard.',
      expanded: false
    },
    {
      question: 'Qui peut m\'aider ?',
      answer: 'Votre administrateur système ou notre équipe de support peuvent vous assister.',
      expanded: false
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Récupérer les informations depuis les query params ou state
    this.route.queryParams.subscribe(params => {
      this.attemptedResource = params['resource'] || 'cette ressource';
      this.forbiddenReason = params['reason'] || 'Permissions insuffisantes';
    });

    // Récupérer les permissions requises depuis l'état de navigation
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.requiredPermissions = navigation.extras.state['permissions'] || [];
    }

    // Vérifier l'état d'authentification
    this.checkAuthStatus();
  }

  /**
   * Vérifier le statut d'authentification
   */
  checkAuthStatus(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  /**
   * Gérer les actions suggérées
   */
  handleAction(action: string): void {
    switch(action) {
      case 'request-access':
        this.requestAccess();
        break;
      case 'switch-account':
        this.switchAccount();
        break;
      case 'contact-support':
        this.contactSupport();
        break;
      case 'view-docs':
        this.viewDocumentation();
        break;
    }
  }

  /**
   * Demander l'accès
   */
  requestAccess(): void {
    if (this.isAuthenticated) {
      this.router.navigate(['/access-request'], {
        queryParams: {
          resource: this.attemptedResource,
          permissions: this.requiredPermissions.join(',')
        }
      });
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
    }
  }

  /**
   * Changer de compte
   */
  switchAccount(): void {
    this.authService.logout();
    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: this.attemptedResource,
        message: 'Connectez-vous avec un compte ayant les permissions nécessaires'
      }
    });
  }

  /**
   * Contacter le support
   */
  contactSupport(): void {
    this.router.navigate(['/support'], {
      queryParams: {
        issue: 'access-denied',
        resource: this.attemptedResource
      }
    });
  }

  /**
   * Voir la documentation
   */
  viewDocumentation(): void {
    this.router.navigate(['/documentation/access-control']);
  }

  /**
   * Retour à l'accueil
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Retour au dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Toggle FAQ item
   */
  toggleFaq(item: any): void {
    item.expanded = !item.expanded;
  }

  /**
   * Vérifier si une action nécessite l'authentification
   */
  shouldShowAction(action: any): boolean {
    if (!action.requiresAuth) {
      return true;
    }
    return this.isAuthenticated;
  }
}
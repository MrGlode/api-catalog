import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

/**
 * Endpoint interface
 */
interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
}

/**
 * Plan interface
 */
interface Plan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  recommended?: boolean;
  requestsPerMonth: string;
}

/**
 * API Detail interface
 */
interface ApiDetail {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  version: string;
  status: 'published' | 'deprecated' | 'beta';
  category: string;
  categoryId: string;
  categoryColor: string;
  provider: string;
  lastUpdated: string;
  endpoints: Endpoint[];
  plans: Plan[];
  benefits: { icon: string; title: string; description: string }[];
}

/**
 * API Detail Component
 */
@Component({
  selector: 'app-api-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './api-detail.component.html',
  styleUrl: './api-detail.component.scss'
})
export class ApiDetailComponent implements OnInit {
  @Input() id!: string;
  
  /**
   * Active tab
   */
  activeTab: 'overview' | 'endpoints' | 'plans' | 'docs' = 'overview';
  
  /**
   * API data (mock)
   */
  api: ApiDetail | null = null;
  
  /**
   * Loading state
   */
  isLoading = true;

  /**
   * Mock APIs database
   */
  private apisDatabase: Record<string, ApiDetail> = {
    'payment-api': {
      id: 'payment-api',
      name: 'Payment Gateway API',
      description: 'API de paiement sécurisée pour traiter les transactions par carte bancaire, virement et prélèvement.',
      longDescription: `L'API Payment Gateway vous permet d'accepter les paiements de vos clients de manière sécurisée et conforme PCI-DSS. 
      
Intégrez facilement les paiements par carte bancaire (Visa, Mastercard, American Express), virements SEPA, et prélèvements automatiques dans vos applications.

Notre infrastructure haute disponibilité garantit un taux de disponibilité de 99.99% et des temps de réponse inférieurs à 200ms.`,
      version: 'v2.1.0',
      status: 'published',
      category: 'Paiements & Finance',
      categoryId: 'finance',
      categoryColor: 'finance',
      provider: 'MYBUSINESS',
      lastUpdated: '15 décembre 2025',
      endpoints: [
        { method: 'POST', path: '/payments', description: 'Créer un nouveau paiement' },
        { method: 'GET', path: '/payments/{id}', description: 'Récupérer les détails d\'un paiement' },
        { method: 'GET', path: '/payments', description: 'Lister les paiements avec filtres' },
        { method: 'POST', path: '/payments/{id}/capture', description: 'Capturer un paiement pré-autorisé' },
        { method: 'POST', path: '/payments/{id}/refund', description: 'Rembourser un paiement' },
        { method: 'DELETE', path: '/payments/{id}', description: 'Annuler un paiement en attente' }
      ],
      plans: [
        {
          name: 'Starter',
          description: 'Pour démarrer et tester l\'API',
          price: 'Gratuit',
          period: '',
          requestsPerMonth: '1 000',
          features: ['1 000 requêtes/mois', 'Support par email', 'Sandbox inclus']
        },
        {
          name: 'Business',
          description: 'Pour les applications en production',
          price: '99€',
          period: '/mois',
          requestsPerMonth: '50 000',
          features: ['50 000 requêtes/mois', 'Support prioritaire', 'SLA 99.9%', 'Webhooks'],
          recommended: true
        },
        {
          name: 'Enterprise',
          description: 'Pour les grands volumes',
          price: 'Sur devis',
          period: '',
          requestsPerMonth: 'Illimité',
          features: ['Requêtes illimitées', 'Support dédié 24/7', 'SLA 99.99%', 'IP dédiée']
        }
      ],
      benefits: [
        {
          icon: '🔒',
          title: 'Sécurité maximale',
          description: 'Certifié PCI-DSS niveau 1, chiffrement TLS 1.3'
        },
        {
          icon: '⚡',
          title: 'Intégration rapide',
          description: 'SDK disponibles, documentation complète, sandbox de test'
        },
        {
          icon: '📊',
          title: 'Reporting complet',
          description: 'Dashboard temps réel, exports, webhooks'
        }
      ]
    },
    'oauth-api': {
      id: 'oauth-api',
      name: 'OAuth 2.0 Service',
      description: 'Service d\'authentification OAuth 2.0 avec support des tokens JWT et refresh tokens.',
      longDescription: `Le service OAuth 2.0 fournit une authentification sécurisée et standardisée pour vos applications.

Supportant tous les flows OAuth 2.0 (Authorization Code, Client Credentials, PKCE), notre service génère des tokens JWT signés et chiffrés.

Intégrez facilement l'authentification sociale (Google, Microsoft, Apple) et le SSO d'entreprise (SAML, OIDC).`,
      version: 'v1.0.0',
      status: 'published',
      category: 'Auth & Sécurité',
      categoryId: 'security',
      categoryColor: 'security',
      provider: 'MYBUSINESS',
      lastUpdated: '10 décembre 2025',
      endpoints: [
        { method: 'POST', path: '/oauth/token', description: 'Obtenir un access token' },
        { method: 'POST', path: '/oauth/authorize', description: 'Initier le flow d\'autorisation' },
        { method: 'POST', path: '/oauth/revoke', description: 'Révoquer un token' },
        { method: 'GET', path: '/oauth/userinfo', description: 'Obtenir les infos utilisateur' },
        { method: 'GET', path: '/.well-known/openid-configuration', description: 'Configuration OIDC' }
      ],
      plans: [
        {
          name: 'Free',
          description: 'Pour les projets personnels',
          price: 'Gratuit',
          period: '',
          requestsPerMonth: '10 000',
          features: ['10 000 authentifications/mois', '1 application', 'Support communauté']
        },
        {
          name: 'Pro',
          description: 'Pour les équipes',
          price: '49€',
          period: '/mois',
          requestsPerMonth: '100 000',
          features: ['100 000 auth/mois', 'Applications illimitées', 'SSO entreprise', 'MFA'],
          recommended: true
        },
        {
          name: 'Enterprise',
          description: 'Pour les grandes organisations',
          price: 'Sur devis',
          period: '',
          requestsPerMonth: 'Illimité',
          features: ['Illimité', 'Tenant dédié', 'Support 24/7', 'Audit logs']
        }
      ],
      benefits: [
        {
          icon: '🛡️',
          title: 'Standards respectés',
          description: 'OAuth 2.0, OpenID Connect, PKCE'
        },
        {
          icon: '🔐',
          title: 'MFA intégré',
          description: 'TOTP, SMS, Email, WebAuthn'
        },
        {
          icon: '🌐',
          title: 'SSO universel',
          description: 'Google, Microsoft, Apple, SAML'
        }
      ]
    }
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadApi();
  }

  /**
   * Load API data
   */
  loadApi(): void {
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      if (this.id && this.apisDatabase[this.id]) {
        this.api = this.apisDatabase[this.id];
      } else {
        // Default to first API for demo
        this.api = this.apisDatabase['payment-api'];
      }
      this.isLoading = false;
    }, 300);
  }

  /**
   * Set active tab
   */
  setTab(tab: 'overview' | 'endpoints' | 'plans' | 'docs'): void {
    this.activeTab = tab;
  }

  /**
   * Get method badge class
   */
  getMethodClass(method: string): string {
    return `badge-${method.toLowerCase()}`;
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'published': return 'badge-green';
      case 'deprecated': return 'badge-orange';
      case 'beta': return 'badge-blue';
      default: return 'badge-gray';
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'published': return 'Publié';
      case 'deprecated': return 'Déprécié';
      case 'beta': return 'Beta';
      default: return status;
    }
  }

  /**
   * Subscribe to plan
   */
  subscribeToPlan(plan: Plan): void {
    // Navigate to subscription flow
    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: `/subscriptions/create?api=${this.api?.id}&plan=${plan.name}`
      }
    });
  }

  /**
   * Go back to catalog
   */
  goBack(): void {
    this.router.navigate(['/catalog']);
  }
}

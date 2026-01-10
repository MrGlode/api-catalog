import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

// ========================================
// INTERFACES - Documentation fonctionnelle
// ========================================

/**
 * Guide/Tutorial step
 */
interface GuideStep {
  title: string;
  content: string;
  tip?: string;
  warning?: string;
  codeExample?: {
    language: string;
    code: string;
  };
}

/**
 * Guide/Tutorial
 */
interface Guide {
  id: string;
  title: string;
  description: string;
  icon: string;
  duration: string;
  difficulty: 'débutant' | 'intermédiaire' | 'avancé';
  steps: GuideStep[];
}

/**
 * Use case / Scenario
 */
interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: string;
  industry?: string;
  benefits: string[];
  workflow: string[];
}

/**
 * Concept / Notion clé
 */
interface Concept {
  id: string;
  term: string;
  definition: string;
  example?: string;
  relatedTerms?: string[];
}

/**
 * FAQ Item
 */
interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

// ========================================
// INTERFACES - Documentation technique
// ========================================

interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

interface EndpointResponse {
  status: number;
  description: string;
  example: string;
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  pathParams?: EndpointParam[];
  queryParams?: EndpointParam[];
  headers?: EndpointParam[];
  requestBody?: {
    contentType: string;
    schema: string;
    example: string;
  };
  responses: EndpointResponse[];
  codeExamples: {
    curl: string;
    javascript: string;
    python: string;
  };
}

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
 * API Detail with functional documentation
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
  baseUrl: string;
  sandboxUrl: string;
  
  // Documentation fonctionnelle
  guides: Guide[];
  useCases: UseCase[];
  concepts: Concept[];
  faq: FaqItem[];
  
  // Documentation technique
  endpoints: Endpoint[];
  plans: Plan[];
  benefits: { icon: string; title: string; description: string }[];
  authentication: {
    type: string;
    description: string;
    steps: string[];
  };
}

/**
 * API Detail Component
 */
@Component({
  selector: 'app-api-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './api-detail.component.html',
  styleUrls: ['./api-detail.component.scss']
})
export class ApiDetailComponent implements OnInit {
  @Input() id!: string;
  
  // Navigation principale
  activeTab: 'overview' | 'docs' | 'reference' | 'plans' = 'overview';
  
  // Navigation documentation
  activeDocsSection: 'guides' | 'usecases' | 'concepts' | 'faq' = 'guides';
  
  // Navigation référence technique
  activeRefSection: 'auth' | 'endpoints' | 'errors' = 'auth';
  
  // États
  api: ApiDetail | null = null;
  isLoading = true;
  selectedGuide: Guide | null = null;
  selectedUseCase: UseCase | null = null;
  selectedEndpoint: Endpoint | null = null;
  activeCodeLang: 'curl' | 'javascript' | 'python' = 'curl';
  codeCopied = false;
  expandedFaqIndex: number | null = null;

  // Exemples de code statiques
  errorFormatExample = `{
  "error": {
    "code": "invalid_request",
    "message": "Le champ 'amount' est requis",
    "param": "amount",
    "doc_url": "https://docs.mybusiness.com/errors/invalid_request"
  }
}`;

  // Base de données mock
  private apisDatabase: Record<string, ApiDetail> = {
    'payment-api': this.getPaymentApiData()
  };

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadApi();
  }

  // ========================================
  // DATA LOADING
  // ========================================

  loadApi(): void {
    this.isLoading = true;
    
    setTimeout(() => {
      if (this.id && this.apisDatabase[this.id]) {
        this.api = this.apisDatabase[this.id];
      } else {
        this.api = this.apisDatabase['payment-api'];
      }
      
      // Sélection par défaut
      if (this.api?.guides.length) {
        this.selectedGuide = this.api.guides[0];
      }
      if (this.api?.useCases.length) {
        this.selectedUseCase = this.api.useCases[0];
      }
      if (this.api?.endpoints.length) {
        this.selectedEndpoint = this.api.endpoints[0];
      }
      
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 300);
  }

  // ========================================
  // NAVIGATION
  // ========================================

  setTab(tab: 'overview' | 'docs' | 'reference' | 'plans'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  setDocsSection(section: 'guides' | 'usecases' | 'concepts' | 'faq'): void {
    this.activeDocsSection = section;
    this.cdr.detectChanges();
  }

  setRefSection(section: 'auth' | 'endpoints' | 'errors'): void {
    this.activeRefSection = section;
    this.cdr.detectChanges();
  }

  selectGuide(guide: Guide): void {
    this.selectedGuide = guide;
    this.cdr.detectChanges();
  }

  selectUseCase(useCase: UseCase): void {
    this.selectedUseCase = useCase;
    this.cdr.detectChanges();
  }

  selectEndpoint(endpoint: Endpoint): void {
    this.selectedEndpoint = endpoint;
    this.cdr.detectChanges();
  }

  toggleFaq(index: number): void {
    this.expandedFaqIndex = this.expandedFaqIndex === index ? null : index;
    this.cdr.detectChanges();
  }

  setCodeLang(lang: 'curl' | 'javascript' | 'python'): void {
    this.activeCodeLang = lang;
    this.cdr.detectChanges();
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code);
    this.codeCopied = true;
    setTimeout(() => {
      this.codeCopied = false;
      this.cdr.detectChanges();
    }, 2000);
    this.cdr.detectChanges();
  }

  // ========================================
  // HELPERS
  // ========================================

  getMethodClass(method: string): string {
    return `badge-${method.toLowerCase()}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'published': return 'badge-green';
      case 'deprecated': return 'badge-orange';
      case 'beta': return 'badge-blue';
      default: return 'badge-gray';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'published': return 'Publié';
      case 'deprecated': return 'Déprécié';
      case 'beta': return 'Beta';
      default: return status;
    }
  }

  getDifficultyClass(difficulty: string): string {
    switch (difficulty) {
      case 'débutant': return 'difficulty-beginner';
      case 'intermédiaire': return 'difficulty-intermediate';
      case 'avancé': return 'difficulty-advanced';
      default: return '';
    }
  }

  getResponseClass(status: number): string {
    if (status >= 200 && status < 300) return 'response-success';
    if (status >= 400 && status < 500) return 'response-warning';
    return 'response-error';
  }

  getAuthCode(): string {
    const examples: Record<string, string> = {
      curl: `curl -X POST ${this.api?.baseUrl}/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "client_id=YOUR_CONSUMER_KEY" \\
  -d "client_secret=YOUR_CONSUMER_SECRET"`,
      javascript: `const response = await fetch('${this.api?.baseUrl}/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: 'YOUR_CONSUMER_KEY',
    client_secret: 'YOUR_CONSUMER_SECRET'
  })
});

const { access_token } = await response.json();`,
      python: `import requests

response = requests.post(
    '${this.api?.baseUrl}/oauth/token',
    data={
        'grant_type': 'client_credentials',
        'client_id': 'YOUR_CONSUMER_KEY',
        'client_secret': 'YOUR_CONSUMER_SECRET'
    }
)

access_token = response.json()['access_token']`
    };
    return examples[this.activeCodeLang] || examples['curl'];
  }

  subscribeToPlan(plan: Plan): void {
    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: `/subscriptions/create?api=${this.api?.id}&plan=${plan.name}`
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/catalog']);
  }

  // ========================================
  // MOCK DATA - Payment API
  // ========================================

  private getPaymentApiData(): ApiDetail {
    return {
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
      baseUrl: 'https://api.mybusiness.com/v2',
      sandboxUrl: 'https://sandbox-api.mybusiness.com/v2',
      
      // ========================================
      // GUIDES / TUTORIELS
      // ========================================
      guides: [
        {
          id: 'quick-start',
          title: 'Démarrage rapide',
          description: 'Intégrez votre premier paiement en moins de 15 minutes',
          icon: '🚀',
          duration: '15 min',
          difficulty: 'débutant',
          steps: [
            {
              title: 'Créer un compte développeur',
              content: 'Rendez-vous sur le portail développeur et créez votre compte gratuit. Vous recevrez immédiatement vos clés API de test (Consumer Key et Consumer Secret).',
              tip: 'Utilisez une adresse email professionnelle pour bénéficier d\'un support prioritaire.'
            },
            {
              title: 'Configurer l\'environnement de test',
              content: 'L\'environnement Sandbox vous permet de tester vos intégrations sans effectuer de vrais paiements. Toutes les transactions sont simulées.',
              tip: 'Utilisez la carte de test 4242 4242 4242 4242 avec n\'importe quelle date future et CVC.'
            },
            {
              title: 'Obtenir un token d\'accès',
              content: 'Avant chaque appel API, vous devez obtenir un token d\'accès OAuth 2.0. Ce token est valide pendant 1 heure.',
              codeExample: {
                language: 'javascript',
                code: `const token = await getAccessToken(consumerKey, consumerSecret);`
              }
            },
            {
              title: 'Créer votre premier paiement',
              content: 'Utilisez l\'endpoint POST /payments pour créer un paiement. Vous devez fournir le montant, la devise, et les informations de carte.',
              codeExample: {
                language: 'javascript',
                code: `const payment = await createPayment({
  amount: 2500, // 25.00 EUR en centimes
  currency: 'EUR',
  description: 'Ma première transaction'
});`
              }
            },
            {
              title: 'Vérifier le statut du paiement',
              content: 'Le paiement peut avoir plusieurs statuts : pending, succeeded, failed. Vérifiez toujours le statut avant de valider une commande.',
              warning: 'Ne considérez jamais un paiement comme réussi sans vérifier le statut "succeeded".'
            }
          ]
        },
        {
          id: 'recurring-payments',
          title: 'Paiements récurrents',
          description: 'Mettez en place des abonnements et prélèvements automatiques',
          icon: '🔄',
          duration: '30 min',
          difficulty: 'intermédiaire',
          steps: [
            {
              title: 'Comprendre les paiements récurrents',
              content: 'Les paiements récurrents permettent de prélever automatiquement vos clients à intervalles réguliers (mensuel, annuel, etc.). Idéal pour les abonnements SaaS, les box mensuelles, ou les services par abonnement.'
            },
            {
              title: 'Créer un mandat de prélèvement',
              content: 'Le client doit d\'abord autoriser les prélèvements futurs en signant un mandat. Ce processus est entièrement dématérialisé.',
              tip: 'Conservez une preuve du consentement client pour vous conformer à la réglementation SEPA.'
            },
            {
              title: 'Définir le plan d\'abonnement',
              content: 'Créez un plan qui définit la fréquence de facturation, le montant, et les conditions (période d\'essai, engagement, etc.).'
            },
            {
              title: 'Gérer le cycle de vie',
              content: 'Surveillez les événements de votre abonnement : renouvellement, échec de paiement, annulation. Configurez des webhooks pour être notifié en temps réel.'
            },
            {
              title: 'Gérer les échecs de paiement',
              content: 'En cas d\'échec (carte expirée, fonds insuffisants), le système retente automatiquement le paiement. Vous pouvez personnaliser la stratégie de relance.',
              warning: 'Prévenez toujours le client avant de suspendre son accès suite à un impayé.'
            }
          ]
        },
        {
          id: 'refunds',
          title: 'Gérer les remboursements',
          description: 'Processus complet pour rembourser vos clients',
          icon: '↩️',
          duration: '20 min',
          difficulty: 'débutant',
          steps: [
            {
              title: 'Types de remboursements',
              content: 'Vous pouvez effectuer un remboursement total ou partiel. Le remboursement partiel est utile pour rembourser un article d\'une commande multi-produits.'
            },
            {
              title: 'Délais de remboursement',
              content: 'Le remboursement apparaît sur le compte du client sous 5 à 10 jours ouvrés selon sa banque. Pour les cartes de débit, c\'est généralement plus rapide.'
            },
            {
              title: 'Effectuer un remboursement',
              content: 'Appelez l\'endpoint POST /payments/{id}/refund avec le montant à rembourser. Sans montant spécifié, le remboursement est total.',
              tip: 'Ajoutez toujours une raison de remboursement pour faciliter le suivi et les analyses.'
            },
            {
              title: 'Suivre le statut',
              content: 'Le remboursement passe par plusieurs états : pending, succeeded, failed. Vous recevez un webhook à chaque changement.'
            }
          ]
        },
        {
          id: 'webhooks',
          title: 'Configurer les webhooks',
          description: 'Recevez des notifications en temps réel sur vos paiements',
          icon: '🔔',
          duration: '25 min',
          difficulty: 'intermédiaire',
          steps: [
            {
              title: 'Qu\'est-ce qu\'un webhook ?',
              content: 'Un webhook est une notification HTTP envoyée à votre serveur lorsqu\'un événement se produit (paiement réussi, remboursement, etc.). C\'est plus efficace que de vérifier périodiquement le statut.'
            },
            {
              title: 'Configurer votre endpoint',
              content: 'Créez un endpoint HTTPS sur votre serveur pour recevoir les webhooks. L\'URL doit être accessible publiquement et répondre en moins de 30 secondes.'
            },
            {
              title: 'Vérifier la signature',
              content: 'Chaque webhook est signé avec votre clé secrète. Vérifiez toujours la signature pour éviter les attaques par injection.',
              warning: 'Ne traitez jamais un webhook sans avoir vérifié sa signature !'
            },
            {
              title: 'Types d\'événements',
              content: 'Principaux événements : payment.succeeded, payment.failed, refund.created, subscription.renewed, subscription.canceled.'
            },
            {
              title: 'Gestion des erreurs',
              content: 'Si votre endpoint échoue, nous retentons l\'envoi avec un délai exponentiel (1min, 5min, 30min, 2h, 24h). Après 5 échecs, le webhook est abandonné.'
            }
          ]
        },
        {
          id: 'go-live',
          title: 'Passer en production',
          description: 'Checklist complète avant le lancement',
          icon: '✅',
          duration: '45 min',
          difficulty: 'avancé',
          steps: [
            {
              title: 'Valider les tests',
              content: 'Assurez-vous d\'avoir testé tous les scénarios : paiement réussi, paiement refusé, remboursement, 3D Secure, webhooks.'
            },
            {
              title: 'Activer le compte production',
              content: 'Complétez la vérification KYC (Know Your Customer) en fournissant les documents de votre entreprise : Kbis, pièce d\'identité du dirigeant, RIB.'
            },
            {
              title: 'Mettre à jour les clés API',
              content: 'Remplacez les clés Sandbox par les clés Production. Stockez-les de manière sécurisée (variables d\'environnement, vault).',
              warning: 'Ne commitez JAMAIS vos clés API dans votre code source !'
            },
            {
              title: 'Configurer les webhooks production',
              content: 'Créez de nouveaux endpoints webhooks pour l\'environnement de production. Testez-les avec l\'outil de simulation du dashboard.'
            },
            {
              title: 'Monitorer les premiers paiements',
              content: 'Surveillez attentivement les premiers paiements réels. Le dashboard affiche en temps réel les transactions et les éventuelles erreurs.'
            }
          ]
        }
      ],
      
      // ========================================
      // CAS D'USAGE
      // ========================================
      useCases: [
        {
          id: 'ecommerce',
          title: 'E-commerce & Marketplace',
          description: 'Acceptez les paiements sur votre boutique en ligne avec une expérience d\'achat fluide.',
          icon: '🛒',
          industry: 'Retail',
          benefits: [
            'Checkout optimisé pour la conversion',
            'Support multi-devises (EUR, USD, GBP...)',
            'Paiement en 1 clic pour clients récurrents',
            'Gestion automatique des paniers abandonnés',
            'Intégration facile avec Shopify, WooCommerce, Magento'
          ],
          workflow: [
            'Le client ajoute des articles au panier',
            'Il accède au checkout et choisit son mode de paiement',
            'L\'API crée une intention de paiement',
            'Le client saisit ses informations de carte',
            '3D Secure si requis par la banque',
            'Confirmation du paiement et envoi de la commande'
          ]
        },
        {
          id: 'saas',
          title: 'SaaS & Abonnements',
          description: 'Gérez vos abonnements et facturations récurrentes automatiquement.',
          icon: '💼',
          industry: 'Software',
          benefits: [
            'Facturation récurrente automatique',
            'Gestion des périodes d\'essai',
            'Upgrade/downgrade de plan en temps réel',
            'Relance automatique en cas d\'impayé',
            'Métriques SaaS : MRR, Churn, LTV'
          ],
          workflow: [
            'Le prospect s\'inscrit avec une période d\'essai',
            'Saisie de la carte à la fin de l\'essai',
            'Facturation automatique chaque mois',
            'Notification avant chaque prélèvement',
            'Gestion des changements de plan',
            'Annulation et remboursement au prorata'
          ]
        },
        {
          id: 'marketplace',
          title: 'Place de marché',
          description: 'Gérez les paiements entre acheteurs et vendeurs avec split payment.',
          icon: '🏪',
          industry: 'Marketplace',
          benefits: [
            'Split payment automatique',
            'Commission configurable par transaction',
            'KYC vendeurs intégré',
            'Gestion des litiges acheteur/vendeur',
            'Virements automatiques aux vendeurs'
          ],
          workflow: [
            'L\'acheteur paie le montant total',
            'Les fonds sont séquestrés sur un compte d\'attente',
            'La commande est livrée et validée',
            'Le paiement est splitté : vendeur + commission',
            'Le vendeur reçoit son virement sous 7 jours'
          ]
        },
        {
          id: 'donation',
          title: 'Dons & Cagnottes',
          description: 'Collectez des dons ponctuels ou récurrents pour votre association.',
          icon: '❤️',
          industry: 'Non-profit',
          benefits: [
            'Formulaire de don personnalisable',
            'Dons récurrents mensuels',
            'Reçus fiscaux automatiques',
            'Cagnottes participatives',
            'Tarifs préférentiels associations'
          ],
          workflow: [
            'Le donateur choisit le montant',
            'Option don ponctuel ou mensuel',
            'Paiement sécurisé par carte',
            'Reçu fiscal envoyé par email',
            'Suivi des dons dans le dashboard'
          ]
        },
        {
          id: 'booking',
          title: 'Réservation & Billetterie',
          description: 'Vendez des billets, réservations avec paiement immédiat ou différé.',
          icon: '🎫',
          industry: 'Events & Travel',
          benefits: [
            'Pré-autorisation sans capture immédiate',
            'Annulation gratuite avec remboursement auto',
            'Gestion des acomptes',
            'Billets électroniques avec QR code',
            'Tarification dynamique'
          ],
          workflow: [
            'Le client sélectionne date et options',
            'Pré-autorisation du montant sur sa carte',
            'Confirmation de réservation envoyée',
            'Capture du paiement J-2 avant l\'événement',
            'Annulation possible avec remboursement auto'
          ]
        }
      ],
      
      // ========================================
      // CONCEPTS / GLOSSAIRE
      // ========================================
      concepts: [
        {
          id: 'pci-dss',
          term: 'PCI-DSS',
          definition: 'Payment Card Industry Data Security Standard. Norme de sécurité internationale pour les entreprises qui traitent des données de cartes bancaires. Notre API est certifiée PCI-DSS niveau 1, le plus haut niveau de certification.',
          example: 'Grâce à notre certification, vous n\'avez pas besoin de stocker les numéros de carte sur vos serveurs.',
          relatedTerms: ['Tokenisation', '3D Secure']
        },
        {
          id: 'tokenisation',
          term: 'Tokenisation',
          definition: 'Processus qui remplace les données sensibles de carte par un identifiant unique (token). Ce token peut être stocké et réutilisé sans exposer les vraies données de carte.',
          example: 'Après le premier paiement, vous recevez un token "pm_xxx" que vous pouvez réutiliser pour les paiements suivants.',
          relatedTerms: ['PCI-DSS', 'Paiement en 1 clic']
        },
        {
          id: '3d-secure',
          term: '3D Secure (3DS)',
          definition: 'Protocole d\'authentification qui ajoute une étape de vérification lors du paiement (code SMS, validation app bancaire). Réduit la fraude et transfère la responsabilité à la banque en cas de litige.',
          example: 'Le client reçoit un SMS avec un code à 6 chiffres qu\'il doit saisir pour confirmer le paiement.',
          relatedTerms: ['SCA', 'Authentification forte']
        },
        {
          id: 'sca',
          term: 'SCA (Strong Customer Authentication)',
          definition: 'Authentification forte du client imposée par la directive européenne DSP2. Requiert au moins 2 facteurs parmi : connaissance (mot de passe), possession (téléphone), inhérence (biométrie).',
          example: 'Un paiement de plus de 30€ déclenche généralement une demande SCA.',
          relatedTerms: ['3D Secure', 'DSP2']
        },
        {
          id: 'capture',
          term: 'Capture',
          definition: 'Action de prélever effectivement les fonds sur la carte du client. Peut être immédiate ou différée (pré-autorisation puis capture ultérieure).',
          example: 'Pour une réservation hôtel, vous faites une pré-autorisation à la réservation et la capture au check-out.',
          relatedTerms: ['Pré-autorisation', 'Annulation']
        },
        {
          id: 'webhook',
          term: 'Webhook',
          definition: 'Notification HTTP envoyée automatiquement à votre serveur lorsqu\'un événement se produit. Permet une intégration temps réel sans polling.',
          example: 'Quand un paiement réussit, vous recevez un webhook "payment.succeeded" avec toutes les informations.',
          relatedTerms: ['API', 'Événement']
        },
        {
          id: 'idempotence',
          term: 'Idempotence',
          definition: 'Garantie qu\'une requête peut être rejouée plusieurs fois sans effet de bord. Utilisez une clé d\'idempotence pour éviter les doublons en cas de timeout.',
          example: 'Si votre requête timeout, vous pouvez la renvoyer avec la même Idempotency-Key sans risquer de créer 2 paiements.',
          relatedTerms: ['API', 'Retry']
        },
        {
          id: 'chargeback',
          term: 'Chargeback (Contestation)',
          definition: 'Procédure initiée par le titulaire de carte auprès de sa banque pour contester un paiement. Le marchand doit fournir des preuves pour défendre la transaction.',
          example: 'Un client affirme n\'avoir jamais reçu sa commande. Sa banque initie un chargeback que vous devez contester avec le tracking.',
          relatedTerms: ['Litige', 'Fraude']
        }
      ],
      
      // ========================================
      // FAQ
      // ========================================
      faq: [
        {
          question: 'Quels moyens de paiement sont acceptés ?',
          answer: 'Nous acceptons les cartes Visa, Mastercard, American Express, CB, ainsi que les virements SEPA et prélèvements. Apple Pay et Google Pay sont également disponibles.',
          category: 'Général'
        },
        {
          question: 'Quels sont les frais de transaction ?',
          answer: 'Les frais varient selon votre plan : 1.4% + 0.25€ pour les cartes européennes, 2.9% + 0.25€ pour les cartes hors Europe. Les plans Enterprise bénéficient de tarifs négociés.',
          category: 'Tarification'
        },
        {
          question: 'Combien de temps pour recevoir les fonds ?',
          answer: 'Les fonds sont virés sur votre compte bancaire sous 7 jours ouvrés par défaut. Le plan Business offre des virements J+2, et Enterprise peut bénéficier de J+1.',
          category: 'Virements'
        },
        {
          question: 'Comment tester sans effectuer de vrais paiements ?',
          answer: 'Utilisez l\'environnement Sandbox avec la carte de test 4242 4242 4242 4242 (n\'importe quelle date future et CVC). Aucun prélèvement réel n\'est effectué.',
          category: 'Tests'
        },
        {
          question: 'Que se passe-t-il si un paiement échoue ?',
          answer: 'Vous recevez un webhook payment.failed avec le code d\'erreur détaillé (carte refusée, fonds insuffisants, etc.). Le client peut réessayer avec une autre carte.',
          category: 'Paiements'
        },
        {
          question: 'Les paiements sont-ils sécurisés ?',
          answer: 'Oui, nous sommes certifiés PCI-DSS niveau 1. Toutes les communications sont chiffrées en TLS 1.3. Les données de carte ne transitent jamais par vos serveurs.',
          category: 'Sécurité'
        },
        {
          question: 'Puis-je personnaliser la page de paiement ?',
          answer: 'Oui, vous pouvez personnaliser les couleurs, le logo, et les textes du formulaire de paiement intégré. Une intégration full API permet un contrôle total du design.',
          category: 'Intégration'
        },
        {
          question: 'Comment gérer les remboursements ?',
          answer: 'Appelez l\'endpoint /payments/{id}/refund pour rembourser un paiement (total ou partiel). Le remboursement apparaît sur le compte client sous 5-10 jours.',
          category: 'Remboursements'
        },
        {
          question: 'Proposez-vous le paiement en plusieurs fois ?',
          answer: 'Oui, nous proposons le paiement en 3x et 4x sans frais pour vos clients. Vous êtes payé immédiatement, nous gérons le risque et les prélèvements.',
          category: 'Paiements'
        },
        {
          question: 'Comment contacter le support ?',
          answer: 'Le support est disponible par email (support@mybusiness.com) et chat dans le dashboard. Les plans Business et Enterprise bénéficient d\'un support téléphonique prioritaire.',
          category: 'Support'
        }
      ],
      
      authentication: {
        type: 'OAuth 2.0 - Client Credentials',
        description: 'Authentifiez-vous en utilisant vos clés API (Consumer Key et Consumer Secret) pour obtenir un token d\'accès.',
        steps: [
          'Récupérez vos clés API depuis le dashboard (Consumer Key & Secret)',
          'Effectuez une requête POST vers /oauth/token avec vos credentials',
          'Utilisez le token reçu dans le header Authorization de vos requêtes',
          'Renouvelez le token avant son expiration (3600 secondes)'
        ]
      },
      
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
      
      // ========================================
      // ENDPOINTS (simplifié)
      // ========================================
      endpoints: [
        { 
          method: 'POST', 
          path: '/payments', 
          summary: 'Créer un paiement',
          description: 'Crée un nouveau paiement.',
          headers: [
            { name: 'Authorization', type: 'string', required: true, description: 'Bearer token' }
          ],
          requestBody: {
            contentType: 'application/json',
            schema: '{ amount, currency, description, customer, payment_method }',
            example: '{ "amount": 2500, "currency": "EUR" }'
          },
          responses: [
            { status: 201, description: 'Paiement créé', example: '{ "id": "pay_xxx", "status": "succeeded" }' }
          ],
          codeExamples: {
            curl: 'curl -X POST .../payments -d \'{"amount": 2500}\'',
            javascript: 'await fetch("/payments", { method: "POST", body: {...} })',
            python: 'requests.post("/payments", json={...})'
          }
        },
        { 
          method: 'GET', 
          path: '/payments/{id}', 
          summary: 'Récupérer un paiement',
          description: 'Récupère les détails d\'un paiement.',
          pathParams: [
            { name: 'id', type: 'string', required: true, description: 'ID du paiement' }
          ],
          headers: [
            { name: 'Authorization', type: 'string', required: true, description: 'Bearer token' }
          ],
          responses: [
            { status: 200, description: 'OK', example: '{ "id": "pay_xxx", "amount": 2500 }' }
          ],
          codeExamples: {
            curl: 'curl .../payments/pay_xxx',
            javascript: 'await fetch("/payments/pay_xxx")',
            python: 'requests.get("/payments/pay_xxx")'
          }
        },
        { 
          method: 'GET', 
          path: '/payments', 
          summary: 'Lister les paiements',
          description: 'Liste les paiements avec pagination.',
          queryParams: [
            { name: 'limit', type: 'integer', required: false, description: 'Limite' },
            { name: 'status', type: 'string', required: false, description: 'Filtrer par statut' }
          ],
          headers: [
            { name: 'Authorization', type: 'string', required: true, description: 'Bearer token' }
          ],
          responses: [
            { status: 200, description: 'OK', example: '{ "data": [...], "has_more": true }' }
          ],
          codeExamples: {
            curl: 'curl ".../payments?limit=20"',
            javascript: 'await fetch("/payments?limit=20")',
            python: 'requests.get("/payments", params={"limit": 20})'
          }
        },
        { 
          method: 'POST', 
          path: '/payments/{id}/refund', 
          summary: 'Rembourser',
          description: 'Rembourse un paiement.',
          pathParams: [
            { name: 'id', type: 'string', required: true, description: 'ID du paiement' }
          ],
          headers: [
            { name: 'Authorization', type: 'string', required: true, description: 'Bearer token' }
          ],
          responses: [
            { status: 200, description: 'Remboursé', example: '{ "id": "ref_xxx" }' }
          ],
          codeExamples: {
            curl: 'curl -X POST .../payments/pay_xxx/refund',
            javascript: 'await fetch("/payments/pay_xxx/refund", { method: "POST" })',
            python: 'requests.post("/payments/pay_xxx/refund")'
          }
        }
      ]
    };
  }
}
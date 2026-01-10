import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';

/**
 * Documentation section interface
 */
interface DocSection {
  id: string;
  title: string;
  icon: string;
  children?: DocPage[];
}

/**
 * Documentation page interface
 */
interface DocPage {
  slug: string;
  title: string;
  content: string;
}

/**
 * Docs Component - Documentation pages
 */
@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule, RouterLink, MarkdownPipe],
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.scss']
})
export class DocsComponent implements OnInit {
  
  /**
   * Current page slug
   */
  currentSlug: string = 'getting-started';
  
  /**
   * Current page content
   */
  currentPage: DocPage | null = null;
  
  /**
   * Loading state
   */
  isLoading = true;
  
  /**
   * Mobile sidebar open
   */
  sidebarOpen = false;

  /**
   * Documentation structure
   */
  docSections: DocSection[] = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: '📚',
      children: [
        {
          slug: 'getting-started',
          title: 'Guide de démarrage',
          content: `
# Guide de démarrage

Bienvenue sur le portail API ! Ce guide vous aidera à démarrer rapidement avec nos API.

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- Un compte développeur actif
- Une application enregistrée
- Vos clés d'API (Consumer Key et Consumer Secret)

## Étapes de démarrage

### 1. Créer une application

Rendez-vous dans la section **Mes Applications** et cliquez sur "Nouvelle application". Donnez un nom à votre application et sélectionnez un tier de throttling adapté à vos besoins.

### 2. Générer vos clés

Une fois votre application créée, accédez à l'onglet **Production** ou **Sandbox** pour générer vos clés d'API. Conservez précieusement votre Consumer Secret, il ne sera affiché qu'une seule fois.

### 3. Souscrire à une API

Parcourez le **Catalogue API** et sélectionnez les API dont vous avez besoin. Cliquez sur "Souscrire" et choisissez le plan tarifaire adapté.

### 4. Faire votre premier appel

Utilisez vos clés pour obtenir un token d'accès, puis effectuez votre premier appel API !

\`\`\`bash
# Obtenir un token
curl -X POST https://api.example.com/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "client_id=YOUR_CONSUMER_KEY" \\
  -d "client_secret=YOUR_CONSUMER_SECRET"
\`\`\`
          `
        },
        {
          slug: 'concepts',
          title: 'Concepts clés',
          content: `
# Concepts clés

Comprendre les concepts fondamentaux vous aidera à mieux utiliser notre plateforme.

## Applications

Une **application** représente votre projet ou service qui consommera les API. Chaque application possède :

- Un identifiant unique
- Des clés d'authentification (Production et Sandbox)
- Des souscriptions aux API

## Souscriptions

Une **souscription** lie une application à une API avec un plan spécifique. Elle définit :

- Les limites de requêtes (throttling)
- Les fonctionnalités accessibles
- Le niveau de support

## Plans et Tiers

Les **plans** définissent les conditions d'utilisation d'une API :

| Plan | Requêtes/mois | Support | Prix |
|------|---------------|---------|------|
| Starter | 1 000 | Email | Gratuit |
| Business | 50 000 | Prioritaire | 49€/mois |
| Enterprise | Illimité | Dédié | Sur devis |

## Environnements

Nous proposons deux environnements :

- **Sandbox** : Pour le développement et les tests (données fictives)
- **Production** : Pour vos applications en production (données réelles)
          `
        }
      ]
    },
    {
      id: 'authentication',
      title: 'Authentification',
      icon: '🔐',
      children: [
        {
          slug: 'oauth2',
          title: 'OAuth 2.0',
          content: `
# OAuth 2.0

Notre plateforme utilise OAuth 2.0 pour l'authentification. Plusieurs flows sont supportés selon votre cas d'usage.

## Client Credentials

Pour les communications serveur-à-serveur (M2M) :

\`\`\`bash
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&scope=read write
\`\`\`

**Réponse :**

\`\`\`json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}
\`\`\`

## Authorization Code

Pour les applications web avec interaction utilisateur :

1. Rediriger l'utilisateur vers l'autorisation
2. Recevoir le code d'autorisation
3. Échanger le code contre un token

\`\`\`
GET /oauth/authorize?
  response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https://yourapp.com/callback
  &scope=read write
  &state=random_state_string
\`\`\`

## Refresh Token

Renouveler un token expiré :

\`\`\`bash
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=YOUR_REFRESH_TOKEN
&client_id=YOUR_CLIENT_ID
\`\`\`
          `
        },
        {
          slug: 'api-keys',
          title: 'Clés API',
          content: `
# Gestion des clés API

Vos clés API sont essentielles pour accéder aux services. Voici comment les gérer efficacement.

## Types de clés

### Consumer Key (Client ID)
Identifiant public de votre application. Peut être partagé dans le code client.

### Consumer Secret (Client Secret)
Clé secrète pour l'authentification. **Ne jamais exposer côté client !**

## Bonnes pratiques

### Sécurité

- ✅ Stocker les secrets dans des variables d'environnement
- ✅ Utiliser un gestionnaire de secrets (Vault, AWS Secrets Manager)
- ✅ Régénérer les clés compromises immédiatement
- ❌ Ne jamais committer les secrets dans Git
- ❌ Ne pas exposer les secrets dans le code frontend

### Rotation des clés

Nous recommandons de régénérer vos clés :

- Tous les 90 jours en production
- Après le départ d'un membre de l'équipe
- En cas de suspicion de compromission

### Environnements séparés

Utilisez des clés différentes pour :

- Développement local
- Staging / Recette
- Production
          `
        }
      ]
    },
    {
      id: 'api-reference',
      title: 'Référence API',
      icon: '📖',
      children: [
        {
          slug: 'endpoints',
          title: 'Endpoints',
          content: `
# Endpoints

Toutes nos API suivent les conventions REST standard.

## URL de base

| Environnement | URL |
|---------------|-----|
| Production | \`https://api.example.com/v1\` |
| Sandbox | \`https://sandbox-api.example.com/v1\` |

## Format des requêtes

### Headers requis

\`\`\`
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
X-Request-ID: {unique-request-id}
\`\`\`

### Corps de requête

Les données doivent être envoyées en JSON :

\`\`\`json
{
  "field1": "value1",
  "field2": "value2"
}
\`\`\`

## Format des réponses

### Succès (2xx)

\`\`\`json
{
  "data": {
    "id": "123",
    "name": "Example"
  },
  "meta": {
    "requestId": "req-abc123"
  }
}
\`\`\`

### Erreur (4xx, 5xx)

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Format invalide"
      }
    ]
  },
  "meta": {
    "requestId": "req-abc123"
  }
}
\`\`\`
          `
        },
        {
          slug: 'errors',
          title: 'Codes d\'erreur',
          content: `
# Codes d'erreur

Notre API utilise les codes HTTP standard et des codes d'erreur personnalisés.

## Codes HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Ressource créée |
| 204 | Succès sans contenu |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

## Codes d'erreur métier

### Authentification

| Code | Description | Solution |
|------|-------------|----------|
| AUTH_001 | Token expiré | Renouveler le token |
| AUTH_002 | Token invalide | Vérifier le format |
| AUTH_003 | Scope insuffisant | Demander les bons scopes |

### Validation

| Code | Description | Solution |
|------|-------------|----------|
| VAL_001 | Champ requis manquant | Ajouter le champ |
| VAL_002 | Format invalide | Vérifier le format attendu |
| VAL_003 | Valeur hors limites | Respecter les contraintes |

### Rate Limiting

| Code | Description | Solution |
|------|-------------|----------|
| RATE_001 | Limite atteinte | Attendre ou upgrader |
| RATE_002 | Quota épuisé | Upgrader le plan |

## Gestion des erreurs

\`\`\`javascript
try {
  const response = await api.call();
} catch (error) {
  if (error.status === 429) {
    // Retry avec backoff exponentiel
    await sleep(error.retryAfter);
    return retry();
  }
  if (error.status === 401) {
    // Renouveler le token
    await refreshToken();
    return retry();
  }
  throw error;
}
\`\`\`
          `
        },
        {
          slug: 'rate-limiting',
          title: 'Rate Limiting',
          content: `
# Rate Limiting

Pour garantir la qualité de service, nous appliquons des limites de requêtes.

## Limites par plan

| Plan | Requêtes/min | Requêtes/jour |
|------|--------------|---------------|
| Starter | 10 | 1 000 |
| Business | 100 | 50 000 |
| Enterprise | 1 000 | Illimité |

## Headers de réponse

Chaque réponse inclut des headers de rate limiting :

\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
\`\`\`

- **Limit** : Nombre max de requêtes
- **Remaining** : Requêtes restantes
- **Reset** : Timestamp de réinitialisation (Unix)

## Dépassement de limite

En cas de dépassement, vous recevrez :

\`\`\`
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": {
    "code": "RATE_001",
    "message": "Rate limit exceeded",
    "retryAfter": 60
  }
}
\`\`\`

## Bonnes pratiques

### Backoff exponentiel

\`\`\`javascript
async function callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status !== 429) throw error;
      const delay = Math.pow(2, i) * 1000;
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}
\`\`\`

### Mise en cache

Cachez les réponses qui ne changent pas fréquemment pour réduire le nombre d'appels.

### Requêtes en batch

Utilisez les endpoints batch quand disponibles pour regrouper plusieurs opérations.
          `
        }
      ]
    },
    {
      id: 'sdks',
      title: 'SDKs & Outils',
      icon: '🛠️',
      children: [
        {
          slug: 'sdk-javascript',
          title: 'SDK JavaScript',
          content: `
# SDK JavaScript

Notre SDK JavaScript facilite l'intégration dans vos applications web et Node.js.

## Installation

\`\`\`bash
npm install @example/api-sdk
# ou
yarn add @example/api-sdk
\`\`\`

## Configuration

\`\`\`javascript
import { ApiClient } from '@example/api-sdk';

const client = new ApiClient({
  clientId: process.env.API_CLIENT_ID,
  clientSecret: process.env.API_CLIENT_SECRET,
  environment: 'production' // ou 'sandbox'
});
\`\`\`

## Utilisation

### Authentification automatique

Le SDK gère automatiquement l'obtention et le renouvellement des tokens.

### Appels API

\`\`\`javascript
// Liste des ressources
const items = await client.resources.list({
  page: 1,
  limit: 20
});

// Récupérer une ressource
const item = await client.resources.get('resource-id');

// Créer une ressource
const newItem = await client.resources.create({
  name: 'New Resource',
  type: 'example'
});

// Mettre à jour
await client.resources.update('resource-id', {
  name: 'Updated Name'
});

// Supprimer
await client.resources.delete('resource-id');
\`\`\`

### Gestion des erreurs

\`\`\`javascript
import { ApiError, RateLimitError } from '@example/api-sdk';

try {
  await client.resources.get('id');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Retry after:', error.retryAfter);
  } else if (error instanceof ApiError) {
    console.log('API Error:', error.code, error.message);
  }
}
\`\`\`
          `
        },
        {
          slug: 'sdk-python',
          title: 'SDK Python',
          content: `
# SDK Python

Notre SDK Python est compatible Python 3.8+ et supporte async/await.

## Installation

\`\`\`bash
pip install example-api-sdk
\`\`\`

## Configuration

\`\`\`python
from example_api import ApiClient

client = ApiClient(
    client_id=os.environ['API_CLIENT_ID'],
    client_secret=os.environ['API_CLIENT_SECRET'],
    environment='production'
)
\`\`\`

## Utilisation synchrone

\`\`\`python
## Liste des ressources
items = client.resources.list(page=1, limit=20)

## Récupérer une ressource
item = client.resources.get('resource-id')

## Créer une ressource
new_item = client.resources.create(
    name='New Resource',
    type='example'
)
\`\`\`

## Utilisation asynchrone

\`\`\`python
import asyncio
from example_api import AsyncApiClient

async def main():
    async with AsyncApiClient(...) as client:
        items = await client.resources.list()
        
        # Appels concurrents
        results = await asyncio.gather(
            client.resources.get('id1'),
            client.resources.get('id2'),
            client.resources.get('id3')
        )

asyncio.run(main())
\`\`\`

## Gestion des erreurs

\`\`\`python
from example_api.exceptions import ApiError, RateLimitError

try:
    item = client.resources.get('id')
except RateLimitError as e:
    print(f'Retry after {e.retry_after} seconds')
except ApiError as e:
    print(f'Error {e.code}: {e.message}')
\`\`\`
          `
        }
      ]
    },
    {
      id: 'support',
      title: 'Support',
      icon: '💬',
      children: [
        {
          slug: 'faq',
          title: 'FAQ',
          content: `
# Foire Aux Questions

## Général

### Comment créer un compte développeur ?
Rendez-vous sur la page d'inscription et remplissez le formulaire. Vous recevrez un email de confirmation.

### Quelle est la différence entre Sandbox et Production ?
Le Sandbox utilise des données fictives pour vos tests. La Production accède aux données réelles.

### Comment changer de plan tarifaire ?
Dans les paramètres de votre souscription, cliquez sur "Changer de plan" et sélectionnez le nouveau plan.

## Authentification

### Mon token a expiré, que faire ?
Utilisez votre refresh token pour obtenir un nouveau token d'accès, ou refaites une authentification complète.

### J'ai perdu mon Consumer Secret
Vous pouvez régénérer vos clés depuis l'onglet Production/Sandbox de votre application. Attention, l'ancienne clé sera invalidée.

### Comment révoquer un token ?
Appelez l'endpoint \`/oauth/revoke\` avec le token à révoquer.

## Technique

### Pourquoi ai-je une erreur 429 ?
Vous avez dépassé votre limite de requêtes. Attendez quelques secondes ou passez à un plan supérieur.

### L'API retourne une erreur 500
Une erreur serveur s'est produite. Réessayez dans quelques instants. Si le problème persiste, contactez le support.

### Comment tester en local ?
Utilisez l'environnement Sandbox avec vos clés de test. Configurez votre callback sur localhost.

## Facturation

### Comment fonctionne la facturation ?
Vous êtes facturé mensuellement selon votre plan. Les dépassements sont facturés à l'unité.

### Puis-je obtenir un remboursement ?
Contactez le support dans les 14 jours suivant votre achat pour discuter d'un remboursement.
          `
        },
        {
          slug: 'contact',
          title: 'Contact',
          content: `
# Contact & Support

Nous sommes là pour vous aider !

## Canaux de support

### Email
- **Support technique** : support@example.com
- **Facturation** : billing@example.com
- **Partenariats** : partners@example.com

### Horaires
Lundi - Vendredi : 9h00 - 18h00 (CET)

### Temps de réponse

| Plan | Temps de réponse |
|------|------------------|
| Starter | 48h ouvrées |
| Business | 24h ouvrées |
| Enterprise | 4h ouvrées |

## Signaler un bug

Pour signaler un bug, merci d'inclure :

1. **Description** du problème
2. **Étapes** pour reproduire
3. **Comportement attendu** vs obtenu
4. **Environnement** (Sandbox/Production)
5. **Request ID** de la requête en erreur

## Status de la plateforme

Consultez l'état des services en temps réel :
**status.example.com**

Abonnez-vous aux notifications pour être alerté des incidents.

## Communauté

- **Forum** : community.example.com
- **GitHub** : github.com/example/api-sdk
- **Stack Overflow** : Tag \`example-api\`
          `
        }
      ]
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.currentSlug = params['slug'] || 'getting-started';
      this.loadPage();
    });
  }

  /**
   * Load current page
   */
  loadPage(): void {
    this.isLoading = true;
    
    // Simulate loading
    setTimeout(() => {
      this.currentPage = this.findPage(this.currentSlug);
      this.isLoading = false;
      this.sidebarOpen = false;
      this.cdr.detectChanges();
    }, 200);
  }

  /**
   * Find page by slug
   */
  findPage(slug: string): DocPage | null {
    for (const section of this.docSections) {
      if (section.children) {
        const page = section.children.find(p => p.slug === slug);
        if (page) return page;
      }
    }
    return null;
  }

  /**
   * Navigate to page
   */
  goToPage(slug: string): void {
    this.router.navigate(['/docs', slug]);
  }

  /**
   * Check if page is active
   */
  isActivePage(slug: string): boolean {
    return this.currentSlug === slug;
  }

  /**
   * Check if section contains active page
   */
  isSectionActive(section: DocSection): boolean {
    if (!section.children) return false;
    return section.children.some(p => p.slug === this.currentSlug);
  }

  /**
   * Toggle mobile sidebar
   */
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.cdr.detectChanges();
  }

  /**
   * Get previous page
   */
  get previousPage(): DocPage | null {
    const allPages = this.getAllPages();
    const currentIndex = allPages.findIndex(p => p.slug === this.currentSlug);
    return currentIndex > 0 ? allPages[currentIndex - 1] : null;
  }

  /**
   * Get next page
   */
  get nextPage(): DocPage | null {
    const allPages = this.getAllPages();
    const currentIndex = allPages.findIndex(p => p.slug === this.currentSlug);
    return currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;
  }

  /**
   * Get all pages flat
   */
  private getAllPages(): DocPage[] {
    const pages: DocPage[] = [];
    for (const section of this.docSections) {
      if (section.children) {
        pages.push(...section.children);
      }
    }
    return pages;
  }
}
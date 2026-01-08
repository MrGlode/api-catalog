/**
 * Modèles liés aux API
 * Basés sur la spécification WSO2 API Manager Devportal v3
 */

import { Pagination } from './common.models';

/**
 * Informations basiques d'une API (utilisé dans les listes)
 */
export interface APIInfo {
  /** Identifiant unique de l'API (UUID) */
  id: string;
  
  /** Nom de l'API */
  name: string;
  
  /** Description de l'API */
  description?: string;
  
  /** Contexte de l'API (chemin de base) */
  context: string;
  
  /** Version de l'API */
  version: string;
  
  /** Type de l'API (HTTP, WS, GRAPHQL, etc.) */
  type: string;
  
  /** Date de création (timestamp) */
  createdTime?: string;
  
  /** Fournisseur de l'API */
  provider: string;
  
  /** Statut dans le cycle de vie */
  lifeCycleStatus: string;
  
  /** URI de la miniature */
  thumbnailUri?: string;
  
  /** Note moyenne de l'API */
  avgRating?: string;
  
  /** Politiques de throttling disponibles */
  throttlingPolicies: string[];
  
  /** Informations publicitaires */
  advertiseInfo?: AdvertiseInfo;
  
  /** Informations métier */
  businessInformation?: APIBusinessInformation;
  
  /** Indique si la souscription est disponible */
  isSubscriptionAvailable: boolean;
  
  /** Label de monétisation */
  monetizationLabel?: string;
  
  /** Vendor de la gateway */
  gatewayVendor?: string;
  
  /** Propriétés personnalisées */
  additionalProperties?: AdditionalProperty[];
  
  /** Indique si l'API est monétisée */
  monetizedInfo?: boolean;
  
  /** Indique si l'API est en mode Egress */
  egress?: boolean;
  
  /** Sous-type de l'API (DEFAULT, AIAPI, etc.) */
  subtype?: string;
}

/**
 * Liste d'API avec pagination
 */
export interface APIList {
  /** Nombre d'APIs retournées */
  count: number;
  
  /** Liste des APIs */
  list: APIInfo[];
  
  /** Informations de pagination */
  pagination: Pagination;
}

/**
 * Détails complets d'une API
 */
export interface API {
  /** Identifiant unique de l'API (UUID) */
  id: string;
  
  /** Nom de l'API */
  name: string;
  
  /** Description détaillée de l'API */
  description?: string;
  
  /** Contexte de l'API */
  context: string;
  
  /** Version de l'API */
  version: string;
  
  /** Fournisseur de l'API */
  provider: string;
  
  /** Définition OpenAPI/Swagger de l'API */
  apiDefinition?: string;
  
  /** URL du WSDL si applicable */
  wsdlUri?: string;
  
  /** Statut dans le cycle de vie */
  lifeCycleStatus: string;
  
  /** Indique si c'est la version par défaut */
  isDefaultVersion?: boolean;
  
  /** Type de transport (HTTP, WS, etc.) */
  type: string;
  
  /** Transports supportés */
  transport?: string[];
  
  /** Opérations disponibles */
  operations?: APIOperation[];
  
  /** Nom du header d'autorisation */
  authorizationHeader?: string;
  
  /** Nom du header de clé API */
  apiKeyHeader?: string;
  
  /** Schémas de sécurité */
  securityScheme?: string[];
  
  /** Tags de recherche */
  tags?: string[];
  
  /** Tiers de souscription disponibles */
  tiers?: APITier[];
  
  /** Indique si une miniature existe */
  hasThumbnail?: boolean;
  
  /** Propriétés additionnelles */
  additionalProperties?: AdditionalProperty[];
  
  /** Informations de monétisation */
  monetization?: APIMonetizationInfo;
  
  /** URLs des endpoints */
  endpointURLs?: EndpointURL[];
  
  /** Informations métier */
  businessInformation?: APIBusinessInformation;
  
  /** Configuration CORS */
  corsConfiguration?: CorsConfiguration;
  
  /** Date de création */
  createdTime?: string;
  
  /** Dernière mise à jour */
  lastUpdatedTime?: string;
  
  /** Catégories de l'API */
  categories?: string[];
  
  /** Sous-type de l'API */
  subtype?: string;
}

/**
 * Opération d'une API
 */
export interface APIOperation {
  /** Identifiant de l'opération */
  id?: string;
  
  /** Chemin cible */
  target?: string;
  
  /** Méthode HTTP */
  verb?: string;
}

/**
 * Tier de souscription avec informations de monétisation
 */
export interface APITier {
  /** Nom du tier */
  tierName: string;
  
  /** Plan du tier (FREE, COMMERCIAL) */
  tierPlan: string;
  
  /** Attributs de monétisation */
  monetizationAttributes?: MonetizationAttributes;
}

/**
 * Attributs de monétisation d'un tier
 */
export interface MonetizationAttributes {
  /** Prix fixe */
  fixedPrice?: string;
  
  /** Prix par requête */
  pricePerRequest?: string;
  
  /** Type de devise */
  currencyType?: string;
  
  /** Cycle de facturation */
  billingCycle?: string;
}

/**
 * Informations de monétisation d'une API
 */
export interface APIMonetizationInfo {
  /** Indique si la monétisation est activée */
  enabled: boolean;
  
  /** Propriétés de monétisation */
  properties?: Record<string, string>;
}

/**
 * URL d'un endpoint
 */
export interface EndpointURL {
  /** Type d'environnement (production, sandbox) */
  environmentType?: string;
  
  /** Nom de l'environnement */
  environmentName?: string;
  
  /** URL de l'endpoint */
  environmentURL?: string;
}

/**
 * Configuration CORS
 */
export interface CorsConfiguration {
  /** Origines autorisées */
  accessControlAllowOrigins: string[];
  
  /** Headers autorisés */
  accessControlAllowHeaders: string[];
  
  /** Méthodes autorisées */
  accessControlAllowMethods: string[];
  
  /** Permettre les credentials */
  accessControlAllowCredentials?: boolean;
}

/**
 * Informations métier d'une API
 */
export interface APIBusinessInformation {
  /** Propriétaire métier */
  businessOwner?: string;
  
  /** Email du propriétaire métier */
  businessOwnerEmail?: string;
  
  /** Propriétaire technique */
  technicalOwner?: string;
  
  /** Email du propriétaire technique */
  technicalOwnerEmail?: string;
}

/**
 * Informations publicitaires d'une API
 */
export interface AdvertiseInfo {
  /** Indique si l'API est annoncée */
  advertised: boolean;
  
  /** Endpoint de production externe */
  apiExternalProductionEndpoint?: string;
  
  /** Endpoint sandbox externe */
  apiExternalSandboxEndpoint?: string;
  
  /** URL du devportal original */
  originalDevPortalUrl?: string;
  
  /** Propriétaire de l'API */
  apiOwner?: string;
  
  /** Vendor de l'API */
  vendor?: 'WSO2' | 'AWS';
}

/**
 * Propriété additionnelle personnalisée
 */
export interface AdditionalProperty {
  /** Nom de la propriété */
  name: string;
  
  /** Valeur de la propriété */
  value: string;
  
  /** Indique si elle doit être affichée */
  display: boolean;
}

/**
 * Catégorie d'API
 */
export interface APICategory {
  /** Identifiant de la catégorie */
  id: string;
  
  /** Nom de la catégorie */
  name: string;
  
  /** Description de la catégorie */
  description?: string;
}

/**
 * Liste de catégories d'API
 */
export interface APICategoryList {
  /** Nombre de catégories retournées */
  count: number;
  
  /** Liste des catégories */
  list: APICategory[];
}

/**
 * Paramètres de recherche d'API
 */
export interface APISearchParams {
  /** Requête de recherche */
  query?: string;
  
  /** Nombre maximum de résultats */
  limit?: number;
  
  /** Offset pour la pagination */
  offset?: number;
  
  /** Tenant cible */
  tenant?: string;
}
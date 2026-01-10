import { Pagination } from './common.models';

/**
 * Informations basiques d'une API (utilisé dans les listes)
 */
export interface APIInfo {
  id: string;
  name: string;
  description?: string;
  context: string;
  version: string;
  type: string;
  createdTime?: string;
  provider: string;
  lifeCycleStatus: string;
  thumbnailUri?: string;
  avgRating?: string;
  throttlingPolicies: string[];
  advertiseInfo?: AdvertiseInfo;
  businessInformation?: APIBusinessInformation;
  isSubscriptionAvailable: boolean;
  monetizationLabel?: string;
  gatewayVendor?: string;
  additionalProperties?: AdditionalProperty[];
  monetizedInfo?: boolean;
  egress?: boolean;
  subtype?: string;
}

/**
 * Liste d'API avec pagination
 */
export interface APIList {
  count: number;
  list: APIInfo[];
  pagination: Pagination;
}

/**
 * Détails complets d'une API
 */
export interface API {
  id: string;
  name: string;
  description?: string;
  context: string;
  version: string;
  provider: string;
  apiDefinition?: string;
  wsdlUri?: string;
  lifeCycleStatus: string;
  isDefaultVersion?: boolean;
  type: string;
  transport?: string[];
  operations?: APIOperation[];
  authorizationHeader?: string;
  apiKeyHeader?: string;
  securityScheme?: string[];
  tags?: string[];
  tiers?: APITier[];
  hasThumbnail?: boolean;
  additionalProperties?: AdditionalProperty[];
  monetization?: APIMonetizationInfo;
  endpointURLs?: EndpointURL[];
  businessInformation?: APIBusinessInformation;
  corsConfiguration?: CorsConfiguration;
  createdTime?: string;
  lastUpdatedTime?: string;
  categories?: string[];
  subtype?: string;
}

/**
 * Opération d'une API
 */
export interface APIOperation {
  id?: string;
  target?: string;
  verb?: string;
}

/**
 * Tier de souscription avec informations de monétisation
 */
export interface APITier {
  tierName: string;
  tierPlan: string;
  monetizationAttributes?: MonetizationAttributes;
}

/**
 * Attributs de monétisation d'un tier
 */
export interface MonetizationAttributes {
  fixedPrice?: string;
  pricePerRequest?: string;
  currencyType?: string;
  billingCycle?: string;
}

/**
 * Informations de monétisation d'une API
 */
export interface APIMonetizationInfo {
  enabled: boolean;
  properties?: Record<string, string>;
}

/**
 * URL d'un endpoint
 */
export interface EndpointURL {
  environmentType?: string;
  environmentName?: string;
  environmentURL?: string;
}

/**
 * Configuration CORS
 */
export interface CorsConfiguration {
  accessControlAllowOrigins: string[];
  accessControlAllowHeaders: string[];
  accessControlAllowMethods: string[];
  accessControlAllowCredentials?: boolean;
}

/**
 * Informations métier d'une API
 */
export interface APIBusinessInformation {
  businessOwner?: string;
  businessOwnerEmail?: string;
  technicalOwner?: string;
  technicalOwnerEmail?: string;
}

/**
 * Informations publicitaires d'une API
 */
export interface AdvertiseInfo {
  advertised: boolean;
  apiExternalProductionEndpoint?: string;
  apiExternalSandboxEndpoint?: string;
  originalDevPortalUrl?: string;
  apiOwner?: string;
  vendor?: 'WSO2' | 'AWS';
}

/**
 * Propriété additionnelle personnalisée
 */
export interface AdditionalProperty {
  name: string;
  value: string;
  display: boolean;
}

/**
 * Catégorie d'API
 */
export interface APICategory {
  id: string;
  name: string;
  description?: string;
}

/**
 * Liste de catégories d'API
 */
export interface APICategoryList {
  count: number;
  list: APICategory[];
}

/**
 * Paramètres de recherche d'API
 */
export interface APISearchParams {
  query?: string;
  limit?: number;
  offset?: number;
  tenant?: string;
}
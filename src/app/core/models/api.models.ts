import { Pagination } from './common.models';

/**
 * Informations basiques d'une API (utilisé dans les listes)
 */
export interface APIInfo {
  id?: string;
  name?: string;
  displayName?: string;
  description?: string;
  context?: string;
  version?: string;
  type?: string;
  createdTime?: string;
  provider?: string;
  lifeCycleStatus?: 'CREATED' | 'PROTOTYPED' | 'PUBLISHED' | 'BLOCKED' | 'DEPRECATED' | 'RETIRED';
  thumbnailUri?: string;
  avgRating?: string;
  throttlingPolicies?: string[];
  advertiseInfo?: AdvertiseInfo;
  businessInformation?: APIBusinessInformation;
  isSubscriptionAvailable?: boolean;
  monetizationLabel?: string;
  gatewayType?: string;
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
  count?: number;
  list?: APIInfo[];
  pagination?: Pagination;
}

/**
 * Détails complets d'une API
 */
export interface API extends APIInfo {
  apiDefinition?: string;
  wsdlUri?: string;
  isDefaultVersion?: boolean;
  transport?: string[];
  operations?: APIOperation[];
  authorizationHeader?: string;
  apiKeyHeader?: string;
  securityScheme?: string[];
  tags?: string[];
  tiers?: APITier[];
  hasThumbnail?: boolean;
  monetization?: APIMonetizationInfo;
  endpointURLs?: APIEndpointURLs[];
  environmentList?: string[];
  scopes?: ScopeInfo[];
  subscriptions?: number;
  categories?: string[];
  keyManagers?: any;
  lastUpdatedTime?: string;
  asyncTransportProtocols?: string[];
}

/**
 * Opération d'une API
 */
export interface APIOperation {
  id?: string;
  target?: string;
  verb?: string;
  authType?: string;
  throttlingPolicy?: string;
  scopes?: string[];
  usedProductIds?: string[];
}

/**
 * Tier de souscription avec informations de monétisation
 */
export interface APITier {
  tierName?: string;
  tierPlan?: 'FREE' | 'COMMERCIAL';
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
}

/**
 * URL d'un endpoint
 */
export interface APIEndpointURLs {
  environmentType?: string;
  environmentName?: string;
  environmentDisplayName?: string;
  URLs?: {
    http?: string;
    https?: string;
    ws?: string;
    wss?: string;
  };
  defaultVersionURLs?: {
    http?: string;
    https?: string;
    ws?: string;
    wss?: string;
  };
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
  name?: string;
  value?: string;
  display?: boolean;
}

/**
 * Catégorie d'API
 */
export interface APICategory {
  id?: string;
  name?: string;
  description?: string;
  numberOfAPIs?: number;
}

/**
 * Liste de catégories d'API
 */
export interface APICategoryList {
  count?: number;
  list?: APICategory[];
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

/**
 * Informations sur le scope d'API
 */
export interface ScopeInfo {
  key?: string;
  name?: string;
  roles?: string[];
  description?: string;
}

/**
 * Tag
 */
export interface Tag {
  value?: string;
  count?: number;
}

/**
 * Tag List
 */
export interface TagList {
  count?: number;
  list?: Tag[];
  pagination?: Pagination;
}

/**
 * Document
 */
export interface Document {
  documentId?: string;
  name?: string;
  type?: 'HOWTO' | 'SAMPLES' | 'PUBLIC_FORUM' | 'SUPPORT_FORUM' | 'API_MESSAGE_FORMAT' | 'SWAGGER_DOC' | 'OTHER';
  summary?: string;
  sourceType?: 'INLINE' | 'MARKDOWN' | 'URL' | 'FILE';
  sourceUrl?: string;
  otherTypeName?: string;
}

/**
 * Document List
 */
export interface DocumentList {
  count?: number;
  list?: Document[];
  pagination?: Pagination;
}

/**
 * Rating
 */
export interface Rating {
  ratingId?: string;
  apiId?: string;
  ratedBy?: string;
  rating?: number;
}

/**
 * Rating List
 */
export interface RatingList {
  avgRating?: string;
  userRating?: number;
  count?: number;
  list?: Rating[];
  pagination?: Pagination;
}

/**
 * Comment
 */
export interface Comment {
  id?: string;
  content?: string;
  createdTime?: string;
  createdBy?: string;
  updatedTime?: string;
  category?: string;
  parentCommentId?: string;
  entryPoint?: 'devPortal' | 'publisher';
  commenterInfo?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
  };
  replies?: CommentList;
}

/**
 * Comment List
 */
export interface CommentList {
  count?: number;
  list?: Comment[];
  pagination?: Pagination;
}
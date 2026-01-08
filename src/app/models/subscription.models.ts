/**
 * Modèles liés aux Souscriptions
 * Basés sur la spécification WSO2 API Manager Devportal v3
 */

import { Pagination } from './common.models';
import { APIInfo } from './api.models';
import { ApplicationInfo } from './application.models';

/**
 * Souscription d'une application à une API
 */
export interface Subscription {
  /** Identifiant de la souscription (UUID) */
  subscriptionId?: string;
  
  /** Identifiant de l'application (UUID) */
  applicationId: string;
  
  /** Identifiant de l'API (UUID) */
  apiId?: string;
  
  /** Informations de l'API */
  apiInfo?: APIInfo;
  
  /** Informations de l'application */
  applicationInfo?: ApplicationInfo;
  
  /** Politique de throttling appliquée */
  throttlingPolicy: string;
  
  /** Politique de throttling demandée */
  requestedThrottlingPolicy?: string;
  
  /** Statut de la souscription */
  status?: 'BLOCKED' | 'PROD_ONLY_BLOCKED' | 'UNBLOCKED' | 'ON_HOLD' | 'REJECTED' | 'TIER_UPDATE_PENDING' | 'DELETE_PENDING';
  
  /** Paramètres de redirection */
  redirectionParams?: string;
}

/**
 * Liste de souscriptions avec pagination
 */
export interface SubscriptionList {
  /** Nombre de souscriptions retournées */
  count: number;
  
  /** Liste des souscriptions */
  list: Subscription[];
  
  /** Informations de pagination */
  pagination: Pagination;
}

/**
 * Politique de throttling (limitation de débit)
 */
export interface ThrottlingPolicy {
  /** Nom de la politique */
  name: string;
  
  /** Description de la politique */
  description?: string;
  
  /** Niveau de la politique (application ou subscription) */
  policyLevel: 'application' | 'subscription';
  
  /** Attributs personnalisés */
  attributes?: Record<string, string>;
  
  /** Nombre maximum de requêtes */
  requestCount: number;
  
  /** Unité de données (KB, MB, GB) */
  dataUnit?: string;
  
  /** Temps unitaire */
  unitTime: number;
  
  /** Unité de temps (min, hour, day, etc.) */
  timeUnit: string;
  
  /** Nombre de requêtes pour le burst control */
  rateLimitCount?: number;
  
  /** Unité de temps pour le burst control */
  rateLimitTimeUnit?: string;
  
  /** Type de politique de quota */
  quotaPolicyType?: 'REQUESTCOUNT' | 'BANDWIDTHVOLUME';
  
  /** Plan tarifaire (FREE ou COMMERCIAL) */
  tierPlan: 'FREE' | 'COMMERCIAL';
  
  /** Arrête les requêtes si le quota est atteint */
  stopOnQuotaReach: boolean;
  
  /** Informations de monétisation */
  monetizationAttributes?: MonetizationInfo;
  
  /** Permissions de la politique de throttling */
  throttlingPolicyPermissions?: ThrottlingPolicyPermissionInfo;
}

/**
 * Liste de politiques de throttling
 */
export interface ThrottlingPolicyList {
  /** Nombre de politiques retournées */
  count: number;
  
  /** Liste des politiques */
  list: ThrottlingPolicy[];
  
  /** Informations de pagination */
  pagination: Pagination;
}

/**
 * Informations de monétisation
 */
export interface MonetizationInfo {
  /** Type de facturation (fixedPrice ou dynamicRate) */
  billingType?: 'fixedPrice' | 'dynamicRate';
  
  /** Cycle de facturation */
  billingCycle?: string;
  
  /** Prix fixe */
  fixedPrice?: string;
  
  /** Prix par requête */
  pricePerRequest?: string;
  
  /** Type de devise */
  currencyType?: string;
}

/**
 * Permissions de politique de throttling
 */
export interface ThrottlingPolicyPermissionInfo {
  /** Type de permission (allow ou deny) */
  type: 'allow' | 'deny';
  
  /** Rôles concernés par cette permission */
  roles: string[];
}

/**
 * Utilisation de monétisation d'API
 */
export interface APIMonetizationUsage {
  /** Propriétés personnalisées liées à l'utilisation de la monétisation */
  properties?: Record<string, string>;
}

/**
 * Topic pour les webhooks/AsyncAPI
 */
export interface Topic {
  /** Identifiant de l'API */
  apiId: string;
  
  /** Nom du topic */
  name: string;
  
  /** Type de topic (publisher, subscriber) */
  type: string;
}

/**
 * Liste de topics
 */
export interface TopicList {
  /** Nombre de topics retournés */
  count: number;
  
  /** Liste des topics */
  list: Topic[];
  
  /** Informations de pagination */
  pagination: Pagination;
}

/**
 * Souscription webhook
 */
export interface WebhookSubscription {
  /** Identifiant de l'API */
  apiId: string;
  
  /** Identifiant de l'application */
  appId: string;
  
  /** Topic souscrit */
  topic: string;
  
  /** URL de callback */
  callBackUrl: string;
  
  /** Heure de livraison */
  deliveryTime?: string;
  
  /** Statut de livraison */
  deliveryStatus?: number;
}

/**
 * Liste de souscriptions webhook
 */
export interface WebhookSubscriptionList {
  /** Nombre de souscriptions webhook retournées */
  count: number;
  
  /** Liste des souscriptions webhook */
  list: WebhookSubscription[];
  
  /** Informations de pagination */
  pagination: Pagination;
}

/**
 * Réinitialisation du throttling au niveau application
 */
export interface ApplicationThrottleReset {
  /** Nom d'utilisateur pour lequel réinitialiser la politique de throttling */
  userName: string;
}
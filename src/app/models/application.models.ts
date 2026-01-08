/**
 * Modèles liés aux Applications
 * Basés sur la spécification WSO2 API Manager Devportal v3
 */

import { Pagination } from './common.models';
import { ScopeInfo } from './auth.models';

/**
 * Informations basiques d'une application
 */
export interface ApplicationInfo {
  /** Identifiant unique de l'application (UUID) */
  applicationId: string;
  
  /** Nom de l'application */
  name: string;
  
  /** Politique de throttling */
  throttlingPolicy: string;
  
  /** Description de l'application */
  description?: string;
  
  /** Statut de l'application */
  status: string;
  
  /** Groupes associés */
  groups?: string[];
  
  /** Nombre de souscriptions */
  subscriptionCount?: number;
  
  /** Attributs personnalisés */
  attributes?: Record<string, string>;
  
  /** Propriétaire de l'application */
  owner: string;
  
  /** Type de token (JWT ou OAUTH) */
  tokenType: string;
  
  /** Date de création (timestamp) */
  createdTime?: string;
  
  /** Date de dernière modification (timestamp) */
  updatedTime?: string;
}

/**
 * Application complète avec tous les détails
 */
export interface Application {
  /** Identifiant unique de l'application (UUID) */
  applicationId?: string;
  
  /** Nom de l'application */
  name: string;
  
  /** Politique de throttling */
  throttlingPolicy: string;
  
  /** Description de l'application */
  description?: string;
  
  /**
   * Type de token généré pour cette application
   * - OAUTH: Token basé UUID
   * - JWT: Token JWT auto-contenu et signé (par défaut)
   */
  tokenType?: 'OAUTH' | 'JWT';
  
  /** Statut de l'application (lecture seule) */
  status?: string;
  
  /** Groupes associés */
  groups?: string[];
  
  /** Nombre de souscriptions (lecture seule) */
  subscriptionCount?: number;
  
  /** Clés d'application (lecture seule) */
  keys?: ApplicationKey[];
  
  /** Attributs personnalisés */
  attributes?: Record<string, string>;
  
  /** Scopes de souscription */
  subscriptionScopes?: ScopeInfo[];
  
  /** Propriétaire de l'application (lecture seule) */
  owner?: string;
  
  /** Indique si le hashing est activé (lecture seule) */
  hashEnabled?: boolean;
  
  /** Date de création (lecture seule, timestamp) */
  createdTime?: string;
  
  /** Date de dernière modification (lecture seule, timestamp) */
  updatedTime?: string;
  
  /** Visibilité de l'application */
  visibility?: 'PRIVATE' | 'SHARED_WITH_ORG';
}

/**
 * Liste d'applications avec pagination
 */
export interface ApplicationList {
  /** Nombre d'applications retournées */
  count: number;
  
  /** Liste des applications */
  list: Application[];
  
  /** Informations de pagination */
  pagination: Pagination;
}

/**
 * Clé d'application (OAuth credentials)
 */
export interface ApplicationKey {
  /** Identifiant du mapping de clé (UUID) */
  keyMappingId?: string;
  
  /** Nom du Key Manager */
  keyManager: string;
  
  /** Clé consumer (client ID) */
  consumerKey: string;
  
  /** Secret consumer (client secret) */
  consumerSecret: string;
  
  /** Scopes supportés */
  supportedGrantTypes?: string[];
  
  /** Callback URL */
  callbackUrl?: string;
  
  /** Type de clé */
  keyState?: string;
  
  /** Mode de groupe */
  groupId?: string;
  
  /** Token */
  token?: ApplicationToken;
  
  /** Type de clé (PRODUCTION ou SANDBOX) */
  keyType?: 'PRODUCTION' | 'SANDBOX';
}

/**
 * Token d'application pour invoquer les API
 */
export interface ApplicationToken {
  /** Token d'accès */
  accessToken: string;
  
  /** Scopes valides pour le token */
  tokenScopes: string[];
  
  /** Durée de validité du token (en secondes) */
  validityTime: number;
}

/**
 * Requête de génération de token d'application
 */
export interface ApplicationTokenGenerateRequest {
  /** Secret consumer de l'application */
  consumerSecret: string;
  
  /** Période de validité du token (en secondes) */
  validityPeriod?: number;
  
  /** Scopes autorisés pour le token */
  scopes?: string[];
  
  /** Token à révoquer si applicable */
  revokeToken?: string;
  
  /** Type de grant */
  grantType?: 'CLIENT_CREDENTIALS' | 'TOKEN_EXCHANGE';
  
  /** Propriétés additionnelles si le serveur d'autorisation en a besoin */
  additionalProperties?: Record<string, any>;
}

/**
 * Clé API (alternative aux tokens OAuth)
 */
export interface APIKey {
  /** Clé API */
  apikey: string;
  
  /** Durée de validité (en secondes) */
  validityTime: number;
}

/**
 * Requête de génération de clé API
 */
export interface APIKeyGenerateRequest {
  /** Période de validité (en secondes) */
  validityPeriod?: number;
  
  /** Propriétés additionnelles */
  additionalProperties?: Record<string, any>;
}

/**
 * Requête de révocation de clé API
 */
export interface APIKeyRevokeRequest {
  /** Clé API à révoquer */
  apikey: string;
}

/**
 * Attribut d'application (champ personnalisé)
 */
export interface ApplicationAttribute {
  /** Description de l'attribut */
  description?: string;
  
  /** Type d'élément d'input à afficher */
  type?: string;
  
  /** Tooltip à afficher */
  tooltip?: string;
  
  /** Indique si l'attribut est requis */
  required?: string;
  
  /** Nom de l'attribut */
  attribute?: string;
  
  /** Indique si l'attribut est caché */
  hidden?: string;
}

/**
 * Liste d'attributs d'application
 */
export interface ApplicationAttributeList {
  /** Nombre d'attributs retournés */
  count: number;
  
  /** Liste des attributs */
  list: ApplicationAttribute[];
}
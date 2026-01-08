/**
 * Modèles liés à l'Authentification et aux Scopes
 * Basés sur la spécification WSO2 API Manager Devportal v3
 */

import { Pagination } from './common.models';

/**
 * Informations sur un scope d'API
 */
export interface ScopeInfo {
  /** Clé du scope */
  key: string;
  
  /** Nom du scope */
  name: string;
  
  /** Rôles autorisés pour ce scope */
  roles?: string[];
  
  /** Description du scope */
  description?: string;
}

/**
 * Liste de scopes avec pagination
 */
export interface ScopeList {
  /** Nombre de scopes retournés */
  count: number;
  
  /** Liste des scopes */
  list: ScopeInfo[];
  
  /** Informations de pagination */
  pagination: Pagination;
}

/**
 * Informations sur un Key Manager
 */
export interface KeyManagerInfo {
  /** Identifiant du Key Manager (UUID) */
  id: string;
  
  /** Nom du Key Manager */
  name: string;
  
  /** Type du Key Manager */
  type: string;
  
  /** Nom d'affichage du Key Manager */
  displayName?: string;
  
  /** Description du Key Manager */
  description?: string;
  
  /** Indique si le Key Manager est activé */
  enabled: boolean;
  
  /** Types de grant disponibles */
  availableGrantTypes?: string[];
  
  /** Endpoint du token */
  tokenEndpoint?: string;
  
  /** Endpoint de révocation */
  revokeEndpoint?: string;
  
  /** Endpoint userInfo */
  userInfoEndpoint?: string;
  
  /** Permet la génération de token */
  enableTokenGeneration: boolean;
  
  /** Permet le chiffrement du token */
  enableTokenEncryption?: boolean;
  
  /** Permet le hashing du token */
  enableTokenHashing?: boolean;
  
  /** Permet la création d'applications OAuth */
  enableOAuthAppCreation?: boolean;
  
  /** Permet le mapping d'applications OAuth existantes */
  enableMapOAuthConsumerApps?: boolean;
  
  /** Configuration de l'application */
  applicationConfiguration?: KeyManagerApplicationConfiguration[];
  
  /** Alias de l'Identity Provider */
  alias?: string;
  
  /** Propriétés additionnelles */
  additionalProperties?: Record<string, any>;
  
  /** Type de token (EXCHANGED, DIRECT, BOTH) */
  tokenType?: 'EXCHANGED' | 'DIRECT' | 'BOTH';
}

/**
 * Configuration d'application pour un Key Manager
 */
export interface KeyManagerApplicationConfiguration {
  /** Nom de la configuration */
  name?: string;
  
  /** Label d'affichage */
  label?: string;
  
  /** Type d'élément (input, select, etc.) */
  type?: string;
  
  /** Indique si c'est requis */
  required?: boolean;
  
  /** Indique si la valeur doit être masquée */
  mask?: boolean;
  
  /** Permet les valeurs multiples */
  multiple?: boolean;
  
  /** Tooltip */
  tooltip?: string;
  
  /** Valeur par défaut */
  default?: any;
  
  /** Valeurs possibles (pour select) */
  values?: any[];
}

/**
 * Liste de Key Managers
 */
export interface KeyManagerList {
  /** Nombre de Key Managers retournés */
  count: number;
  
  /** Liste des Key Managers */
  list: KeyManagerInfo[];
}

/**
 * Utilisateur pour l'auto-inscription
 */
export interface User {
  /** Nom d'utilisateur */
  username: string;
  
  /** Mot de passe */
  password: string;
  
  /** Prénom */
  firstName: string;
  
  /** Nom */
  lastName: string;
  
  /** Email */
  email: string;
}

/**
 * Requête d'enregistrement DCR (Dynamic Client Registration)
 */
export interface DCRRequest {
  /** URL de callback */
  callbackUrl: string;
  
  /** Nom du client */
  clientName: string;
  
  /** Propriétaire du client */
  owner: string;
  
  /** Types de grant OAuth2 */
  grantType: string;
  
  /** Indique si c'est une application SaaS */
  saasApp: boolean;
}

/**
 * Réponse d'enregistrement DCR
 */
export interface DCRResponse {
  /** ID du client OAuth2 */
  clientId: string;
  
  /** Nom du client */
  clientName: string;
  
  /** URL de callback */
  callBackURL: string;
  
  /** Secret du client OAuth2 */
  clientSecret: string;
  
  /** Indique si c'est une application SaaS */
  isSaasApplication: boolean;
  
  /** Propriétaire de l'application */
  appOwner: string;
  
  /** Configuration JSON */
  jsonString?: string;
  
  /** Attributs JSON de l'application */
  jsonAppAttribute?: string;
  
  /** Type de token */
  tokenType?: string;
}

/**
 * Requête de token OAuth2
 */
export interface TokenRequest {
  /** Type de grant */
  grantType: 'password' | 'client_credentials' | 'refresh_token' | 'authorization_code';
  
  /** Nom d'utilisateur (pour password grant) */
  username?: string;
  
  /** Mot de passe (pour password grant) */
  password?: string;
  
  /** Token de refresh (pour refresh_token grant) */
  refreshToken?: string;
  
  /** Scopes demandés (séparés par des espaces) */
  scope?: string;
}

/**
 * Réponse de token OAuth2
 */
export interface TokenResponse {
  /** Token d'accès */
  accessToken: string;
  
  /** Token de refresh */
  refreshToken?: string;
  
  /** Scopes accordés */
  scope: string;
  
  /** Type de token (Bearer) */
  tokenType: string;
  
  /** Durée de validité en secondes */
  expiresIn: number;
}
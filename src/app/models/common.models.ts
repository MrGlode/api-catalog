/**
 * WSO2 Common Models
 * Shared types used across multiple schemas
 */

/**
 * Pagination information
 */
export interface Pagination {
  offset?: number;
  limit?: number;
  total?: number;
  next?: string;
  previous?: string;
}

/**
 * Advertise Info
 */
export interface AdvertiseInfo {
  advertised?: boolean;
  apiExternalProductionEndpoint?: string;
  apiExternalSandboxEndpoint?: string;
  originalDevPortalUrl?: string;
  apiOwner?: string;
  vendor?: string;
}

/**
 * Error Response
 */
export interface ErrorResponse {
  code?: number;
  message?: string;
  description?: string;
  moreInfo?: string;
  error?: ErrorDetail[];
}

/**
 * Error Detail
 */
export interface ErrorDetail {
  code?: string;
  message?: string;
  description?: string;
}

/**
 * Settings
 */
export interface Settings {
  grantTypes?: string[];
  scopes?: string[];
  applicationSharingEnabled?: boolean;
  mapExistingAuthApps?: boolean;
  apiGatewayEndpoint?: string;
  monetizationEnabled?: boolean;
  recommendationEnabled?: boolean;
  isUnlimitedTierPaid?: boolean;
  identityProvider?: {
    external?: boolean;
  };
  isAnonymousModeEnabled?: boolean;
  isPasswordChangeEnabled?: boolean;
  userStorePasswordPattern?: string;
  passwordPolicyPattern?: string;
  passwordPolicyMinLength?: number;
  passwordPolicyMaxLength?: number;
  isJWTEnabledForLoginTokens?: boolean;
  apiChatEnabled?: boolean;
  aiAuthTokenProvided?: boolean;
  marketplaceAssistantEnabled?: boolean;
}

/**
 * Key Manager
 */
export interface KeyManager {
  id?: string;
  name?: string;
  displayName?: string;
  type?: string;
  description?: string;
  enabled?: boolean;
  availableGrantTypes?: string[];
  tokenEndpoint?: string;
  revokeEndpoint?: string;
  userInfoEndpoint?: string;
  enableTokenGeneration?: boolean;
  enableTokenEncryption?: boolean;
  enableTokenHashing?: boolean;
  enableMapOAuthConsumerApps?: boolean;
  enableOAuthAppCreation?: boolean;
  enableSelfValidationJWT?: boolean;
  additionalProperties?: Record<string, any>;
}

/**
 * Key Manager List
 */
export interface KeyManagerList {
  count?: number;
  list?: KeyManager[];
}

/**
 * Tenant
 */
export interface Tenant {
  domain?: string;
  status?: 'active' | 'inactive';
}

/**
 * Tenant List
 */
export interface TenantList {
  count?: number;
  list?: Tenant[];
  pagination?: Pagination;
}

/**
 * Search Query Parameters
 */
export interface SearchParams {
  query?: string;
  limit?: number;
  offset?: number;
}

/**
 * API Query Parameters
 */
export interface APIQueryParams extends SearchParams {
  xWso2Tenant?: string;
}

/**
 * Application Query Parameters
 */
export interface ApplicationQueryParams extends SearchParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Subscription Query Parameters
 */
export interface SubscriptionQueryParams {
  apiId?: string;
  applicationId?: string;
  groupId?: string;
  limit?: number;
  offset?: number;
}
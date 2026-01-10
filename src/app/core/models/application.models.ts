/**
 * WSO2 Application Models
 * Based on devportal-v3.yaml schemas: Application, ApplicationInfo, ApplicationList
 */

import { Pagination } from './common.models';
import { ScopeInfo } from './api.models';

/**
 * Application Key
 */
export interface ApplicationKey {
  keyMappingId?: string;
  keyManager?: string;
  consumerKey?: string;
  consumerSecret?: string;
  supportedGrantTypes?: string[];
  callbackUrl?: string;
  keyState?: string;
  keyType?: 'PRODUCTION' | 'SANDBOX';
  mode?: 'MAPPED' | 'CREATED';
  groupId?: string;
  token?: ApplicationToken;
  additionalProperties?: Record<string, any>;
}

/**
 * Application Token
 */
export interface ApplicationToken {
  accessToken?: string;
  tokenScopes?: string[];
  validityTime?: number;
}

/**
 * Application Key Generate Request
 */
export interface ApplicationKeyGenerateRequest {
  keyType: 'PRODUCTION' | 'SANDBOX';
  keyManager?: string;
  grantTypesToBeSupported?: string[];
  callbackUrl?: string;
  scopes?: string[];
  validityTime?: number;
  additionalProperties?: Record<string, string>;
}

/**
 * Application Key Regenerate Response
 */
export interface ApplicationKeyReGenerateResponse {
  consumerKey?: string;
  consumerSecret?: string;
}

/**
 * Application Token Generate Request
 */
export interface ApplicationTokenGenerateRequest {
  consumerSecret?: string;
  validityPeriod?: number;
  scopes?: string[];
  revokeToken?: string;
  additionalProperties?: Record<string, string>;
}

/**
 * Application Info - Basic application details (list view)
 */
export interface ApplicationInfo {
  applicationId?: string;
  name?: string;
  throttlingPolicy?: string;
  description?: string;
  status?: 'APPROVED' | 'CREATED' | 'REJECTED' | 'ON_HOLD';
  groups?: string[];
  subscriptionCount?: number;
  attributes?: Record<string, any>;
  owner?: string;
  tokenType?: 'OAUTH' | 'JWT';
  createdTime?: string;
  updatedTime?: string;
}

/**
 * Application - Full application details
 */
export interface Application extends ApplicationInfo {
  keys?: ApplicationKey[];
  subscriptionScopes?: ScopeInfo[];
  hashEnabled?: boolean;
  visibility?: 'PRIVATE' | 'SHARED_WITH_ORG';
}

/**
 * Application List response
 */
export interface ApplicationList {
  count?: number;
  list?: ApplicationInfo[];
  pagination?: Pagination;
}

/**
 * Application Create/Update Request
 */
export interface ApplicationRequest {
  name: string;
  throttlingPolicy: string;
  description?: string;
  tokenType?: 'OAUTH' | 'JWT';
  groups?: string[];
  attributes?: Record<string, string>;
}
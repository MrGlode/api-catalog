/**
 * WSO2 Subscription Models
 * Based on devportal-v3.yaml schemas: Subscription, SubscriptionList
 */

import { Pagination } from './common.models';
import { APIInfo } from './api.models';
import { ApplicationInfo } from './application.models';

/**
 * Subscription Status
 */
export type SubscriptionStatus = 
  | 'BLOCKED'
  | 'PROD_ONLY_BLOCKED'
  | 'UNBLOCKED'
  | 'ON_HOLD'
  | 'REJECTED'
  | 'TIER_UPDATE_PENDING'
  | 'DELETE_PENDING';

/**
 * Subscription
 */
export interface Subscription {
  subscriptionId?: string;
  applicationId: string;
  apiId?: string;
  apiInfo?: APIInfo;
  applicationInfo?: ApplicationInfo;
  throttlingPolicy: string;
  requestedThrottlingPolicy?: string;
  status?: SubscriptionStatus;
  redirectionParams?: string;
}

/**
 * Subscription List response
 */
export interface SubscriptionList {
  count?: number;
  list?: Subscription[];
  pagination?: Pagination;
}

/**
 * Subscription Create Request
 */
export interface SubscriptionRequest {
  applicationId: string;
  apiId: string;
  throttlingPolicy: string;
}

/**
 * Subscription Update Request
 */
export interface SubscriptionUpdateRequest {
  throttlingPolicy: string;
  requestedThrottlingPolicy?: string;
}

/**
 * Throttling Policy
 */
export interface ThrottlingPolicy {
  name?: string;
  displayName?: string;
  description?: string;
  isDeployed?: boolean;
  type?: string;
  requestCount?: number;
  dataUnit?: string;
  unitTime?: number;
  timeUnit?: string;
  rateLimitCount?: number;
  rateLimitTimeUnit?: string;
  quotaPolicyType?: 'REQUESTCOUNT' | 'BANDWIDTHVOLUME';
  tierPlan?: 'FREE' | 'COMMERCIAL';
  stopOnQuotaReach?: boolean;
  policyName?: string;
  monetizationAttributes?: {
    fixedPrice?: string;
    pricePerRequest?: string;
    currencyType?: string;
    billingCycle?: string;
  };
  throttlingPolicyPermissions?: {
    type?: 'allow' | 'deny';
    roles?: string[];
  };
}

/**
 * Throttling Policy List
 */
export interface ThrottlingPolicyList {
  count?: number;
  list?: ThrottlingPolicy[];
  pagination?: Pagination;
}
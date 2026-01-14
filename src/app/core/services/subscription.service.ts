/**
 * WSO2 Subscription Service
 * Handles API subscriptions with WSO2 API Manager Devportal
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment, getApiUrl } from '../../../environments/environment';
import {
  Subscription,
  SubscriptionList,
  SubscriptionRequest,
  SubscriptionQueryParams,
  ThrottlingPolicyList
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  constructor(private http: HttpClient) {}

  // ========================================
  // Subscriptions CRUD
  // ========================================

  /**
   * Get list of subscriptions
   */
  getSubscriptions(params?: SubscriptionQueryParams): Observable<SubscriptionList> {
    const url = getApiUrl('/subscriptions');
    let httpParams = new HttpParams();

    if (params?.apiId) {
      httpParams = httpParams.set('apiId', params.apiId);
    }
    if (params?.applicationId) {
      httpParams = httpParams.set('applicationId', params.applicationId);
    }
    if (params?.groupId) {
      httpParams = httpParams.set('groupId', params.groupId);
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.offset) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }

    return this.http.get<SubscriptionList>(url, { params: httpParams });
  }

  /**
   * Get subscription by ID
   */
  getSubscriptionById(subscriptionId: string): Observable<Subscription> {
    const url = getApiUrl(`/subscriptions/${subscriptionId}`);
    
    return this.http.get<Subscription>(url);
  }

  /**
   * Create new subscription
   */
  createSubscription(subscription: SubscriptionRequest): Observable<Subscription> {
    const url = getApiUrl('/subscriptions');
    
    return this.http.post<Subscription>(url, subscription);
  }

  /**
   * Create multiple subscriptions at once
   */
  createMultipleSubscriptions(subscriptions: SubscriptionRequest[]): Observable<Subscription[]> {
    const url = getApiUrl('/subscriptions/multiple');
    
    return this.http.post<Subscription[]>(url, subscriptions);
  }

  /**
   * Update subscription (change throttling policy)
   */
  updateSubscription(subscriptionId: string, throttlingPolicy: string): Observable<Subscription> {
    const url = getApiUrl(`/subscriptions/${subscriptionId}`);
    
    return this.http.put<Subscription>(url, { throttlingPolicy });
  }

  /**
   * Delete subscription
   */
  deleteSubscription(subscriptionId: string): Observable<void> {
    const url = getApiUrl(`/subscriptions/${subscriptionId}`);
    
    return this.http.delete<void>(url);
  }

  // ========================================
  // Additional Information
  // ========================================

  /**
   * Get additional info for subscription workflow
   */
  getAdditionalInfoForSubscription(subscriptionId: string): Observable<any> {
    const url = getApiUrl(`/subscriptions/${subscriptionId}/additionalInfo`);
    
    return this.http.get(url);
  }

  // ========================================
  // Throttling Policies
  // ========================================

  /**
   * Get available subscription throttling policies
   */
  getSubscriptionPolicies(): Observable<ThrottlingPolicyList> {
    const url = getApiUrl('/throttling-policies/subscription');
    
    return this.http.get<ThrottlingPolicyList>(url);
  }

  /**
   * Get available application throttling policies
   */
  getApplicationThrottlingPolicies(): Observable<ThrottlingPolicyList> {
    const url = getApiUrl('/throttling-policies/application');
    
    return this.http.get<ThrottlingPolicyList>(url);
  }

  /**
   * Get subscription policy by name
   */
  getSubscriptionPolicy(policyName: string): Observable<any> {
    const url = getApiUrl(`/throttling-policies/subscription/${policyName}`);
    
    return this.http.get(url);
  }

  // ========================================
  // Helper Methods
  // ========================================

  /**
   * Get subscriptions for a specific API
   */
  getApiSubscriptions(apiId: string, limit?: number, offset?: number): Observable<SubscriptionList> {
    return this.getSubscriptions({ apiId, limit, offset });
  }

  /**
   * Get subscriptions for a specific application
   */
  getApplicationSubscriptions(applicationId: string, limit?: number, offset?: number): Observable<SubscriptionList> {
    return this.getSubscriptions({ applicationId, limit, offset });
  }

  /**
   * Check if an API is subscribed by an application
   */
  isSubscribed(apiId: string, applicationId: string): Observable<boolean> {
    return new Observable(observer => {
      this.getSubscriptions({ apiId, applicationId, limit: 1 }).subscribe({
        next: (result) => {
          observer.next(result.count !== undefined && result.count > 0);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  /**
   * Subscribe to an API with a specific application and policy
   */
  subscribeToApi(apiId: string, applicationId: string, throttlingPolicy: string): Observable<Subscription> {
    return this.createSubscription({
      apiId,
      applicationId,
      throttlingPolicy
    });
  }

  /**
   * Unsubscribe from an API
   */
  unsubscribeFromApi(subscriptionId: string): Observable<void> {
    return this.deleteSubscription(subscriptionId);
  }
}

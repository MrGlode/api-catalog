import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  Subscription,
  SubscriptionList,
  ThrottlingPolicy,
  ThrottlingPolicyList
} from '../../models';

/**
 * Service de gestion des Souscriptions
 * Gère les souscriptions entre applications et API
 */
@Injectable({
  providedIn: 'root'
})
export class SubscriptionService extends BaseApiService {
  // ==================== SOUSCRIPTIONS ====================

  /**
   * Récupère la liste des souscriptions
   * @param apiId - Filtre par API (optionnel)
   * @param applicationId - Filtre par application (optionnel)
   * @param groupId - Filtre par groupe (optionnel)
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste de souscriptions
   */
  getSubscriptions(
    apiId?: string,
    applicationId?: string,
    groupId?: string,
    limit?: number,
    offset?: number
  ): Observable<SubscriptionList> {
    const params = this.buildQueryParams({
      apiId,
      applicationId,
      groupId,
      limit,
      offset
    });

    return this.get<SubscriptionList>('/subscriptions', { params });
  }

  /**
   * Récupère une souscription par son ID
   * @param subscriptionId - Identifiant de la souscription
   * @returns Observable de la souscription
   */
  getSubscriptionById(subscriptionId: string): Observable<Subscription> {
    return this.get<Subscription>(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Crée une nouvelle souscription
   * @param applicationId - Identifiant de l'application
   * @param apiId - Identifiant de l'API
   * @param throttlingPolicy - Politique de throttling à appliquer
   * @returns Observable de la souscription créée
   */
  createSubscription(
    applicationId: string,
    apiId: string,
    throttlingPolicy: string
  ): Observable<Subscription> {
    const body: Partial<Subscription> = {
      applicationId,
      apiId,
      throttlingPolicy
    };

    return this.post<Subscription>('/subscriptions', body);
  }

  /**
   * Crée plusieurs souscriptions en une seule requête
   * @param applicationId - Identifiant de l'application
   * @param apiIds - Liste des identifiants d'API
   * @param throttlingPolicy - Politique de throttling commune
   * @returns Observable de la liste de souscriptions créées
   */
  createMultipleSubscriptions(
    applicationId: string,
    apiIds: string[],
    throttlingPolicy: string
  ): Observable<Subscription[]> {
    const body = {
      applicationId,
      apiIdentifiers: apiIds.map(id => ({ apiId: id })),
      throttlingPolicy
    };

    return this.post<Subscription[]>('/subscriptions/multiple', body);
  }

  /**
   * Met à jour une souscription (change la politique de throttling)
   * @param subscriptionId - Identifiant de la souscription
   * @param throttlingPolicy - Nouvelle politique de throttling
   * @returns Observable de la souscription mise à jour
   */
  updateSubscription(
    subscriptionId: string,
    throttlingPolicy: string
  ): Observable<Subscription> {
    const body = { throttlingPolicy };
    return this.put<Subscription>(`/subscriptions/${subscriptionId}`, body);
  }

  /**
   * Supprime une souscription
   * @param subscriptionId - Identifiant de la souscription
   * @returns Observable vide
   */
  deleteSubscription(subscriptionId: string): Observable<void> {
    return this.delete<void>(`/subscriptions/${subscriptionId}`);
  }

  // ==================== POLITIQUES DE THROTTLING ====================

  /**
   * Récupère les politiques de throttling disponibles
   * @param policyLevel - Niveau de la politique (application ou subscription)
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste des politiques
   */
  getThrottlingPolicies(
    policyLevel: 'application' | 'subscription',
    limit?: number,
    offset?: number
  ): Observable<ThrottlingPolicyList> {
    const params = this.buildPaginationParams(limit, offset);
    
    return this.get<ThrottlingPolicyList>(
      `/throttling-policies/${policyLevel}`,
      { params }
    );
  }

  /**
   * Récupère une politique de throttling spécifique
   * @param policyLevel - Niveau de la politique
   * @param policyId - Identifiant de la politique
   * @returns Observable de la politique
   */
  getThrottlingPolicyById(
    policyLevel: 'application' | 'subscription',
    policyId: string
  ): Observable<ThrottlingPolicy> {
    return this.get<ThrottlingPolicy>(
      `/throttling-policies/${policyLevel}/${policyId}`
    );
  }

  /**
   * Récupère les politiques de throttling au niveau subscription
   * Raccourci pour getThrottlingPolicies avec policyLevel='subscription'
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste des politiques
   */
  getSubscriptionThrottlingPolicies(
    limit?: number,
    offset?: number
  ): Observable<ThrottlingPolicyList> {
    return this.getThrottlingPolicies('subscription', limit, offset);
  }

  /**
   * Récupère les politiques de throttling au niveau application
   * Raccourci pour getThrottlingPolicies avec policyLevel='application'
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste des politiques
   */
  getApplicationThrottlingPolicies(
    limit?: number,
    offset?: number
  ): Observable<ThrottlingPolicyList> {
    return this.getThrottlingPolicies('application', limit, offset);
  }

  // ==================== UTILITAIRES ====================

  /**
   * Vérifie si une application est déjà souscrite à une API
   * @param applicationId - Identifiant de l'application
   * @param apiId - Identifiant de l'API
   * @returns Observable booléen
   */
  isSubscribed(applicationId: string, apiId: string): Observable<boolean> {
    return new Observable(observer => {
      this.getSubscriptions(apiId, applicationId).subscribe({
        next: (result) => {
          observer.next(result.count > 0);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  /**
   * Récupère toutes les souscriptions d'une application
   * @param applicationId - Identifiant de l'application
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste de souscriptions
   */
  getApplicationSubscriptions(
    applicationId: string,
    limit?: number,
    offset?: number
  ): Observable<SubscriptionList> {
    return this.getSubscriptions(undefined, applicationId, undefined, limit, offset);
  }

  /**
   * Récupère toutes les souscriptions à une API
   * @param apiId - Identifiant de l'API
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste de souscriptions
   */
  getApiSubscriptions(
    apiId: string,
    limit?: number,
    offset?: number
  ): Observable<SubscriptionList> {
    return this.getSubscriptions(apiId, undefined, undefined, limit, offset);
  }
}
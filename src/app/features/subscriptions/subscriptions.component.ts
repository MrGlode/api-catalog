import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { SubscriptionService } from '../../core/services/subscription.service';
import { ApplicationService } from '../../core/services/application.service';
import { 
  Subscription, 
  SubscriptionList,
  ApplicationInfo,
  ApplicationList
} from '../../core/models';
import { forkJoin } from 'rxjs';

/**
 * Display subscription with enriched data
 */
interface DisplaySubscription {
  subscriptionId: string;
  apiId: string;
  apiName: string;
  apiVersion: string;
  apiDescription: string;
  apiContext: string;
  apiType: string;
  applicationId: string;
  applicationName: string;
  throttlingPolicy: string;
  status: string;
}

/**
 * Grouped subscriptions by application
 */
interface ApplicationGroup {
  applicationId: string;
  applicationName: string;
  subscriptions: DisplaySubscription[];
}

/**
 * Subscriptions Component - Manage API subscriptions
 * Connected to WSO2 API Manager
 */
@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss']
})
export class SubscriptionsComponent implements OnInit {
  
  /**
   * Loading state
   */
  isLoading = true;
  
  /**
   * Error message
   */
  errorMessage: string | null = null;
  
  /**
   * All subscriptions
   */
  subscriptions: DisplaySubscription[] = [];
  
  /**
   * Grouped by application
   */
  applicationGroups: ApplicationGroup[] = [];
  
  /**
   * View mode: 'list' or 'grouped'
   */
  viewMode: 'list' | 'grouped' = 'grouped';
  
  /**
   * Selected subscription for detail
   */
  selectedSubscription: DisplaySubscription | null = null;
  
  /**
   * Show unsubscribe confirmation
   */
  showUnsubscribeModal = false;
  subscriptionToUnsubscribe: DisplaySubscription | null = null;
  isUnsubscribing = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private subscriptionService: SubscriptionService,
    private applicationService: ApplicationService
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  /**
   * Load subscriptions from WSO2
   */
  loadSubscriptions(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    // First get all applications, then get subscriptions for each
    this.applicationService.getApplications({ limit: 100 }).subscribe({
      next: (appResponse: ApplicationList) => {
        const applications = appResponse.list || [];
        
        if (applications.length === 0) {
          this.subscriptions = [];
          this.applicationGroups = [];
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }
        
        // Get subscriptions - WSO2 returns all if no filter
        this.subscriptionService.getSubscriptions({ limit: 1000 }).subscribe({
          next: (subResponse: SubscriptionList) => {
            const rawSubscriptions = subResponse.list || [];
            this.subscriptions = this.mapSubscriptions(rawSubscriptions, applications);
            this.groupByApplication();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Failed to load subscriptions', error);
            this.errorMessage = 'Impossible de charger les souscriptions.';
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (error) => {
        console.error('Failed to load applications', error);
        this.errorMessage = 'Impossible de charger les applications.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Map WSO2 subscriptions to display format
   */
  mapSubscriptions(subs: Subscription[], apps: ApplicationInfo[]): DisplaySubscription[] {
    return subs.map(sub => {
      // Find application name
      const app = apps.find(a => a.applicationId === sub.applicationId);
      
      return {
        subscriptionId: sub.subscriptionId || '',
        apiId: sub.apiId || sub.apiInfo?.id || '',
        apiName: sub.apiInfo?.name || 'API inconnue',
        apiVersion: sub.apiInfo?.version || '',
        apiDescription: sub.apiInfo?.description || '',
        apiContext: sub.apiInfo?.context || '',
        apiType: sub.apiInfo?.type || 'HTTP',
        applicationId: sub.applicationId,
        applicationName: app?.name || sub.applicationInfo?.name || 'Application inconnue',
        throttlingPolicy: sub.throttlingPolicy,
        status: sub.status || 'UNBLOCKED'
      };
    });
  }

  /**
   * Group subscriptions by application
   */
  groupByApplication(): void {
    const groups = new Map<string, ApplicationGroup>();
    
    for (const sub of this.subscriptions) {
      if (!groups.has(sub.applicationId)) {
        groups.set(sub.applicationId, {
          applicationId: sub.applicationId,
          applicationName: sub.applicationName,
          subscriptions: []
        });
      }
      groups.get(sub.applicationId)!.subscriptions.push(sub);
    }
    
    this.applicationGroups = Array.from(groups.values());
  }

  /**
   * Set view mode
   */
  setViewMode(mode: 'list' | 'grouped'): void {
    this.viewMode = mode;
    this.cdr.detectChanges();
  }

  /**
   * Select subscription
   */
  selectSubscription(sub: DisplaySubscription): void {
    this.selectedSubscription = sub;
    this.cdr.detectChanges();
  }

  /**
   * Close detail panel
   */
  closeDetail(): void {
    this.selectedSubscription = null;
    this.cdr.detectChanges();
  }

  /**
   * Navigate to API detail
   */
  goToApi(apiId: string): void {
    this.router.navigate(['/catalog', apiId]);
  }

  /**
   * Navigate to application
   */
  goToApplication(appId: string): void {
    this.router.navigate(['/applications'], { queryParams: { id: appId } });
  }

  /**
   * Open unsubscribe modal
   */
  openUnsubscribeModal(sub: DisplaySubscription, event: Event): void {
    event.stopPropagation();
    this.subscriptionToUnsubscribe = sub;
    this.showUnsubscribeModal = true;
    this.cdr.detectChanges();
  }

  /**
   * Close unsubscribe modal
   */
  closeUnsubscribeModal(): void {
    this.showUnsubscribeModal = false;
    this.subscriptionToUnsubscribe = null;
    this.cdr.detectChanges();
  }

  /**
   * Confirm unsubscribe
   */
  confirmUnsubscribe(): void {
    if (!this.subscriptionToUnsubscribe) return;
    
    this.isUnsubscribing = true;
    const subId = this.subscriptionToUnsubscribe.subscriptionId;
    
    this.subscriptionService.deleteSubscription(subId).subscribe({
      next: () => {
        this.subscriptions = this.subscriptions.filter(s => s.subscriptionId !== subId);
        this.groupByApplication();
        
        if (this.selectedSubscription?.subscriptionId === subId) {
          this.selectedSubscription = null;
        }
        
        this.isUnsubscribing = false;
        this.closeUnsubscribeModal();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to unsubscribe', error);
        this.isUnsubscribing = false;
        alert('Erreur lors de la désinscription: ' + (error.error?.description || error.message));
      }
    });
  }

  /**
   * Get status class
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'UNBLOCKED': return 'badge-green';
      case 'BLOCKED': return 'badge-red';
      case 'PROD_ONLY_BLOCKED': return 'badge-orange';
      case 'ON_HOLD': return 'badge-gray';
      case 'REJECTED': return 'badge-red';
      case 'TIER_UPDATE_PENDING': return 'badge-blue';
      case 'DELETE_PENDING': return 'badge-orange';
      default: return 'badge-gray';
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'UNBLOCKED': return 'Active';
      case 'BLOCKED': return 'Bloquée';
      case 'PROD_ONLY_BLOCKED': return 'Prod bloquée';
      case 'ON_HOLD': return 'En attente';
      case 'REJECTED': return 'Rejetée';
      case 'TIER_UPDATE_PENDING': return 'Mise à jour en cours';
      case 'DELETE_PENDING': return 'Suppression en cours';
      default: return status;
    }
  }

  /**
   * Get API type class for color
   */
  getApiTypeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'HTTP':
      case 'REST':
        return 'badge-blue';
      case 'SOAP':
        return 'badge-purple';
      case 'GRAPHQL':
        return 'badge-pink';
      case 'WEBSOCKET':
      case 'WS':
        return 'badge-green';
      case 'SSE':
        return 'badge-orange';
      default:
        return 'badge-gray';
    }
  }

  /**
   * Get total subscriptions count
   */
  get totalSubscriptions(): number {
    return this.subscriptions.length;
  }

  /**
   * Get active subscriptions count
   */
  get activeSubscriptions(): number {
    return this.subscriptions.filter(s => s.status === 'UNBLOCKED').length;
  }

  /**
   * Reload subscriptions
   */
  reload(): void {
    this.loadSubscriptions();
  }
}
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

/**
 * Subscription interface
 */
interface Subscription {
  id: string;
  apiId: string;
  apiName: string;
  apiVersion: string;
  apiDescription: string;
  apiCategory: string;
  apiCategoryColor: string;
  applicationId: string;
  applicationName: string;
  tier: string;
  status: 'UNBLOCKED' | 'BLOCKED' | 'PROD_ONLY_BLOCKED' | 'ON_HOLD';
  createdAt: string;
  requestCount?: number;
}

/**
 * Grouped subscriptions by application
 */
interface ApplicationGroup {
  applicationId: string;
  applicationName: string;
  subscriptions: Subscription[];
}

/**
 * Subscriptions Component - Manage API subscriptions
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
   * All subscriptions
   */
  subscriptions: Subscription[] = [];
  
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
  selectedSubscription: Subscription | null = null;
  
  /**
   * Show unsubscribe confirmation
   */
  showUnsubscribeModal = false;
  subscriptionToUnsubscribe: Subscription | null = null;

  /**
   * Mock subscriptions data
   */
  private mockSubscriptions: Subscription[] = [
    {
      id: 'sub-001',
      apiId: 'payment-api',
      apiName: 'Payment Gateway API',
      apiVersion: 'v2.1.0',
      apiDescription: 'API de paiement sécurisée pour traiter les transactions.',
      apiCategory: 'Paiements & Finance',
      apiCategoryColor: 'finance',
      applicationId: 'app-001',
      applicationName: 'E-Commerce App',
      tier: 'Business',
      status: 'UNBLOCKED',
      createdAt: '2025-11-20',
      requestCount: 12847
    },
    {
      id: 'sub-002',
      apiId: 'oauth-api',
      apiName: 'OAuth 2.0 Service',
      apiVersion: 'v1.0.0',
      apiDescription: 'Service d\'authentification OAuth 2.0 avec support JWT.',
      apiCategory: 'Auth & Sécurité',
      apiCategoryColor: 'security',
      applicationId: 'app-001',
      applicationName: 'E-Commerce App',
      tier: 'Pro',
      status: 'UNBLOCKED',
      createdAt: '2025-11-20',
      requestCount: 45231
    },
    {
      id: 'sub-003',
      apiId: 'notification-api',
      apiName: 'Notification Service',
      apiVersion: 'v1.2.0',
      apiDescription: 'Envoi de notifications push, email et SMS.',
      apiCategory: 'Messagerie',
      apiCategoryColor: 'communication',
      applicationId: 'app-001',
      applicationName: 'E-Commerce App',
      tier: 'Starter',
      status: 'UNBLOCKED',
      createdAt: '2025-12-01',
      requestCount: 8934
    },
    {
      id: 'sub-004',
      apiId: 'payment-api',
      apiName: 'Payment Gateway API',
      apiVersion: 'v2.1.0',
      apiDescription: 'API de paiement sécurisée pour traiter les transactions.',
      apiCategory: 'Paiements & Finance',
      apiCategoryColor: 'finance',
      applicationId: 'app-002',
      applicationName: 'Mobile Banking',
      tier: 'Enterprise',
      status: 'UNBLOCKED',
      createdAt: '2025-12-05',
      requestCount: 67432
    },
    {
      id: 'sub-005',
      apiId: 'analytics-api',
      apiName: 'Analytics API',
      apiVersion: 'v3.0.0',
      apiDescription: 'Collecte et analyse des données utilisateur.',
      apiCategory: 'Analytics',
      apiCategoryColor: 'data',
      applicationId: 'app-002',
      applicationName: 'Mobile Banking',
      tier: 'Business',
      status: 'BLOCKED',
      createdAt: '2025-12-10',
      requestCount: 0
    },
    {
      id: 'sub-006',
      apiId: 'geocoding-api',
      apiName: 'Geocoding API',
      apiVersion: 'v2.0.0',
      apiDescription: 'Conversion d\'adresses en coordonnées GPS.',
      apiCategory: 'Géolocalisation',
      apiCategoryColor: 'geo',
      applicationId: 'app-003',
      applicationName: 'Analytics Dashboard',
      tier: 'Starter',
      status: 'ON_HOLD',
      createdAt: '2025-12-15',
      requestCount: 234
    }
  ];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  /**
   * Load subscriptions
   */
  loadSubscriptions(): void {
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      this.subscriptions = this.mockSubscriptions;
      this.groupByApplication();
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 500);
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
  selectSubscription(sub: Subscription): void {
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
  openUnsubscribeModal(sub: Subscription, event: Event): void {
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
    
    const subId = this.subscriptionToUnsubscribe.id;
    this.subscriptions = this.subscriptions.filter(s => s.id !== subId);
    this.groupByApplication();
    
    if (this.selectedSubscription?.id === subId) {
      this.selectedSubscription = null;
    }
    
    this.closeUnsubscribeModal();
    this.cdr.detectChanges();
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
      default: return status;
    }
  }

  /**
   * Get category class
   */
  getCategoryClass(color: string): string {
    return `badge-${color}`;
  }

  /**
   * Format request count
   */
  formatRequestCount(count: number | undefined): string {
    if (!count) return '0';
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
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
   * Get total request count
   */
  get totalRequests(): number {
    return this.subscriptions.reduce((sum, s) => sum + (s.requestCount || 0), 0);
  }
}
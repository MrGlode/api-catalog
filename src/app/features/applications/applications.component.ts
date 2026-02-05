import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../core/services/application.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import {
  Application,
  ApplicationInfo,
  ApplicationList,
  ApplicationKey,
  ApplicationKeyGenerateRequest,
  ThrottlingPolicy,
  Subscription,
  SubscriptionList
} from '../../core/models';

/**
 * Display subscription interface
 */
interface DisplaySubscription {
  subscriptionId: string;
  apiId: string;
  apiName: string;
  apiVersion: string;
  apiDescription: string;
  apiContext: string;
  apiType: string;
  throttlingPolicy: string;
  status: string;
}

/**
 * Applications Component - Manage user applications
 * Connected to WSO2 API Manager
 */
@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {

  /**
   * Loading states
   */
  isLoading = true;
  isCreating = false;
  isGeneratingKeys = false;
  isLoadingSubscriptions = false;
  isUnsubscribing = false;

  /**
   * Error message
   */
  errorMessage: string | null = null;

  /**
   * Applications list
   */
  applications: ApplicationInfo[] = [];

  /**
   * Selected application for detail view (full details with keys)
   */
  selectedApp: Application | null = null;

  /**
   * Subscriptions for selected application
   */
  appSubscriptions: DisplaySubscription[] = [];

  /**
   * Active tab in detail view
   */
  activeTab: 'overview' | 'production' | 'sandbox' | 'subscriptions' = 'overview';

  /**
   * Show create modal
   */
  showCreateModal = false;

  /**
   * Show unsubscribe modal
   */
  showUnsubscribeModal = false;
  subscriptionToUnsubscribe: DisplaySubscription | null = null;

  /**
   * New application form
   */
  newApp = {
    name: '',
    description: '',
    tier: 'Unlimited'
  };

  /**
   * Available throttling policies (loaded from WSO2)
   */
  availableTiers: ThrottlingPolicy[] = [];

  /**
   * Visibility toggles for secrets
   */
  showProductionSecret = false;
  showSandboxSecret = false;

  /**
   * Copy feedback
   */
  copiedField: string | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private applicationService: ApplicationService,
    private subscriptionService: SubscriptionService
  ) { }

  ngOnInit(): void {
    this.loadApplications();
    this.loadThrottlingPolicies();
  }

  /**
   * Load applications from WSO2
   */
  loadApplications(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.applicationService.getApplications({ limit: 100 }).subscribe({
      next: (response: ApplicationList) => {
        this.applications = response.list || [];
        this.isLoading = false;
        this.cdr.detectChanges();

        const appId = this.route.snapshot.queryParamMap.get('app');
        if (appId) {
          const targetApp = this.applications.find(a => a.applicationId === appId);
          if (targetApp) {
            this.selectApp(targetApp);
          }
        }
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
   * Load throttling policies from WSO2
   */
  loadThrottlingPolicies(): void {
    this.subscriptionService.getApplicationThrottlingPolicies().subscribe({
      next: (response) => {
        this.availableTiers = response.list || [];
        // Set default tier if available
        if (this.availableTiers.length > 0 && !this.newApp.tier) {
          const firstTier = this.availableTiers[0];
          this.newApp.tier = firstTier.name || firstTier.policyName || 'Unlimited';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.warn('Could not load throttling policies, using defaults', error);
        // Fallback defaults
        this.availableTiers = [
          { name: 'Unlimited', description: 'Aucune limite de requêtes' },
          { name: '10PerMin', description: '10 requêtes par minute' },
          { name: '20PerMin', description: '20 requêtes par minute' },
          { name: '50PerMin', description: '50 requêtes par minute' }
        ] as ThrottlingPolicy[];
      }
    });
  }

  /**
   * Select application and load full details
   */
  selectApp(app: ApplicationInfo): void {
    if (!app.applicationId) return;

    this.applicationService.getApplicationById(app.applicationId).subscribe({
      next: (fullApp: Application) => {
        this.selectedApp = fullApp;
        this.activeTab = 'overview';
        this.showProductionSecret = false;
        this.showSandboxSecret = false;
        this.appSubscriptions = [];
        this.cdr.detectChanges();

        // Load subscriptions for this application
        this.loadAppSubscriptions(app.applicationId!);

        // Load Oauth keys for this application
        this.loadAppKeys(app.applicationId!);
      },
      error: (error) => {
        console.error('Failed to load application details', error);
      }
    });
  }

  /**
   * Load OAuth keys for selected application
   */
  loadAppKeys(applicationId: string): void {
    this.applicationService.getApplicationKeys(applicationId).subscribe({
      next: (response: any) => {
        if (this.selectedApp) {
          this.selectedApp.keys = response.list || [];
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Failed to load application keys', error);
      }
    });
  }

  /**
   * Load subscriptions for selected application
   */
  loadAppSubscriptions(applicationId: string): void {
    this.isLoadingSubscriptions = true;

    this.subscriptionService.getApplicationSubscriptions(applicationId, 100).subscribe({
      next: (response: SubscriptionList) => {
        this.appSubscriptions = this.mapSubscriptions(response.list || []);
        this.isLoadingSubscriptions = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load subscriptions', error);
        this.isLoadingSubscriptions = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Map WSO2 subscriptions to display format
   */
  mapSubscriptions(subs: Subscription[]): DisplaySubscription[] {
    return subs.map(sub => ({
      subscriptionId: sub.subscriptionId || '',
      apiId: sub.apiId || sub.apiInfo?.id || '',
      apiName: sub.apiInfo?.name || 'API inconnue',
      apiVersion: sub.apiInfo?.version || '',
      apiDescription: sub.apiInfo?.description || '',
      apiContext: sub.apiInfo?.context || '',
      apiType: sub.apiInfo?.type || 'HTTP',
      throttlingPolicy: sub.throttlingPolicy,
      status: sub.status || 'UNBLOCKED'
    }));
  }

  /**
   * Close detail view
   */
  closeDetail(): void {
    this.selectedApp = null;
    this.appSubscriptions = [];
    this.cdr.detectChanges();
  }

  /**
   * Set active tab
   */
  setTab(tab: 'overview' | 'production' | 'sandbox' | 'subscriptions'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  /**
   * Open create modal
   */
  openCreateModal(): void {
    const firstTier = this.availableTiers[0];
    this.newApp = {
      name: '',
      description: '',
      tier: firstTier?.name || firstTier?.policyName || 'Unlimited'
    };
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  /**
   * Close create modal
   */
  closeCreateModal(): void {
    this.showCreateModal = false;
    this.cdr.detectChanges();
  }

  /**
   * Create new application
   */
  createApplication(): void {
    if (!this.newApp.name.trim()) return;

    this.isCreating = true;

    this.applicationService.createApplication({
      name: this.newApp.name,
      description: this.newApp.description,
      throttlingPolicy: this.newApp.tier
    }).subscribe({
      next: (newApplication: Application) => {
        this.isCreating = false;
        this.closeCreateModal();
        this.loadApplications();

        // Select the new application
        if (newApplication.applicationId) {
          this.selectApp(newApplication);
        }
      },
      error: (error) => {
        console.error('Failed to create application', error);
        this.isCreating = false;
        alert('Erreur lors de la création de l\'application: ' + (error.error?.description || error.message));
      }
    });
  }

  /**
   * Generate OAuth keys for environment
   */
  generateKeys(keyType: 'PRODUCTION' | 'SANDBOX'): void {
    if (!this.selectedApp?.applicationId) return;

    this.isGeneratingKeys = true;

    const request: ApplicationKeyGenerateRequest = {
      keyType,
      grantTypesToBeSupported: ['client_credentials', 'password'],
      callbackUrl: keyType === 'PRODUCTION'
        ? 'https://myapp.com/callback'
        : 'http://localhost:4200/callback',
      validityTime: 3600
    };

    this.applicationService.generateKeys(this.selectedApp.applicationId, request).subscribe({
      next: (key: ApplicationKey) => {
        this.isGeneratingKeys = false;
        // Reload application to get updated keys
        this.selectApp(this.selectedApp!);
      },
      error: (error) => {
        console.error('Failed to generate keys', error);
        this.isGeneratingKeys = false;
        alert('Erreur lors de la génération des clés: ' + (error.error?.description || error.message));
      }
    });
  }

  /**
   * Regenerate consumer secret
   */
  regenerateSecret(keyType: 'PRODUCTION' | 'SANDBOX'): void {
    if (!this.selectedApp?.applicationId) return;

    const key = this.getKeyByType(keyType);
    if (!key?.keyMappingId) {
      alert('Aucune clé trouvée pour ce type.');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir régénérer le secret ? L\'ancien secret ne sera plus valide.')) {
      return;
    }

    this.applicationService.regenerateSecret(this.selectedApp.applicationId, key.keyMappingId).subscribe({
      next: (response) => {
        // Reload application to get updated keys
        this.selectApp(this.selectedApp!);
      },
      error: (error) => {
        console.error('Failed to regenerate secret', error);
        alert('Erreur lors de la régénération du secret: ' + (error.error?.description || error.message));
      }
    });
  }

  // ========================================
  // Subscriptions Management
  // ========================================

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
        this.appSubscriptions = this.appSubscriptions.filter(s => s.subscriptionId !== subId);

        // Update subscription count in selected app
        if (this.selectedApp) {
          this.selectedApp.subscriptionCount = (this.selectedApp.subscriptionCount || 1) - 1;
        }

        // Update count in applications list
        const appInList = this.applications.find(a => a.applicationId === this.selectedApp?.applicationId);
        if (appInList) {
          appInList.subscriptionCount = (appInList.subscriptionCount || 1) - 1;
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
   * Navigate to API detail
   */
  goToApi(apiId: string): void {
    this.router.navigate(['/catalog', apiId]);
  }

  /**
   * Get subscription status class
   */
  getSubscriptionStatusClass(status: string): string {
    switch (status) {
      case 'UNBLOCKED': return 'badge-green';
      case 'BLOCKED': return 'badge-red';
      case 'PROD_ONLY_BLOCKED': return 'badge-orange';
      case 'ON_HOLD': return 'badge-gray';
      case 'REJECTED': return 'badge-red';
      default: return 'badge-gray';
    }
  }

  /**
   * Get subscription status label
   */
  getSubscriptionStatusLabel(status: string): string {
    switch (status) {
      case 'UNBLOCKED': return 'Active';
      case 'BLOCKED': return 'Bloquée';
      case 'PROD_ONLY_BLOCKED': return 'Prod bloquée';
      case 'ON_HOLD': return 'En attente';
      case 'REJECTED': return 'Rejetée';
      default: return status;
    }
  }

  /**
   * Get API type class
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
      default:
        return 'badge-gray';
    }
  }

  // ========================================
  // Keys Helper Methods
  // ========================================

  /**
   * Get key by type from selected application
   */
  getKeyByType(keyType: 'PRODUCTION' | 'SANDBOX'): ApplicationKey | undefined {
    return this.selectedApp?.keys?.find(k => k.keyType === keyType);
  }

  /**
   * Check if application has key of type
   */
  hasKey(keyType: 'PRODUCTION' | 'SANDBOX'): boolean {
    return !!this.getKeyByType(keyType);
  }

  /**
   * Get grant types for a key type
   */
  getGrantTypes(keyType: 'PRODUCTION' | 'SANDBOX'): string[] {
    return this.getKeyByType(keyType)?.supportedGrantTypes || [];
  }

  /**
   * Get callback URL for a key type
   */
  getCallbackUrl(keyType: 'PRODUCTION' | 'SANDBOX'): string | undefined {
    return this.getKeyByType(keyType)?.callbackUrl;
  }

  /**
   * Get consumer key for a key type
   */
  getConsumerKey(keyType: 'PRODUCTION' | 'SANDBOX'): string {
    return this.getKeyByType(keyType)?.consumerKey || '';
  }

  /**
   * Get consumer secret for a key type
   */
  getConsumerSecret(keyType: 'PRODUCTION' | 'SANDBOX'): string {
    return this.getKeyByType(keyType)?.consumerSecret || '';
  }

  /**
   * Get key state for a key type
   */
  getKeyState(keyType: 'PRODUCTION' | 'SANDBOX'): string | undefined {
    return this.getKeyByType(keyType)?.keyState;
  }

  /**
   * Copy to clipboard
   */
  copyToClipboard(text: string, field: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedField = field;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.copiedField = null;
        this.cdr.detectChanges();
      }, 2000);
    });
  }

  /**
   * Toggle secret visibility
   */
  toggleSecretVisibility(keyType: 'PRODUCTION' | 'SANDBOX'): void {
    if (keyType === 'PRODUCTION') {
      this.showProductionSecret = !this.showProductionSecret;
    } else {
      this.showSandboxSecret = !this.showSandboxSecret;
    }
    this.cdr.detectChanges();
  }

  /**
   * Get status class
   */
  getStatusClass(status?: string): string {
    switch (status) {
      case 'APPROVED': return 'badge-green';
      case 'CREATED': return 'badge-blue';
      case 'REJECTED': return 'badge-red';
      case 'ON_HOLD': return 'badge-orange';
      default: return 'badge-gray';
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status?: string): string {
    switch (status) {
      case 'APPROVED': return 'Approuvée';
      case 'CREATED': return 'Créée';
      case 'REJECTED': return 'Rejetée';
      case 'ON_HOLD': return 'En attente';
      default: return status || 'Inconnu';
    }
  }

  /**
   * Get key state class
   */
  getKeyStateClass(state?: string): string {
    switch (state) {
      case 'APPROVED': return 'badge-green';
      case 'CREATED': return 'badge-blue';
      case 'REJECTED': return 'badge-red';
      case 'BLOCKED': return 'badge-orange';
      default: return 'badge-gray';
    }
  }

  /**
   * Mask secret
   */
  maskSecret(secret?: string): string {
    if (!secret || secret.length <= 8) return '••••••••';
    return secret.substring(0, 4) + '••••••••••••' + secret.substring(secret.length - 4);
  }

  /**
   * Delete application
   */
  deleteApp(app: ApplicationInfo, event: Event): void {
    event.stopPropagation();

    if (!app.applicationId) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${app.name}" ?`)) {
      return;
    }

    this.applicationService.deleteApplication(app.applicationId).subscribe({
      next: () => {
        this.applications = this.applications.filter(a => a.applicationId !== app.applicationId);
        if (this.selectedApp?.applicationId === app.applicationId) {
          this.selectedApp = null;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to delete application', error);
        alert('Erreur lors de la suppression: ' + (error.error?.description || error.message));
      }
    });
  }

  /**
   * Format date for display
   */
  formatDate(dateInput?: string | number): string {
    if (!dateInput) return '-';

    try {
      let date: Date;

      // Si c'est un nombre (timestamp en millisecondes)
      if (typeof dateInput === 'number') {
        date = new Date(dateInput);
      }
      // Si c'est une string numérique (timestamp en string)
      else if (/^\d+$/.test(dateInput)) {
        date = new Date(parseInt(dateInput, 10));
      }
      // Sinon c'est une date ISO ou autre format string
      else {
        date = new Date(dateInput);
      }

      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return '-';
      }

      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  }

  /**
   * Reload applications
   */
  reload(): void {
    this.loadApplications();
  }
}
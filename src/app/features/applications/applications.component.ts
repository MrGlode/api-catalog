import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../core/services/application.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { 
  Application, 
  ApplicationInfo, 
  ApplicationList, 
  ApplicationKey,
  ApplicationKeyGenerateRequest,
  ThrottlingPolicy
} from '../../core/models';

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
   * Active tab in detail view
   */
  activeTab: 'overview' | 'production' | 'sandbox' = 'overview';
  
  /**
   * Show create modal
   */
  showCreateModal = false;
  
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
    private applicationService: ApplicationService,
    private subscriptionService: SubscriptionService
  ) {}

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
          this.newApp.tier = this.availableTiers[0].policyName || 'Unlimited';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.warn('Could not load throttling policies, using defaults', error);
        // Fallback defaults
        this.availableTiers = [
          { policyName: 'Unlimited', description: 'Aucune limite de requêtes' },
          { policyName: '10PerMin', description: '10 requêtes par minute' },
          { policyName: '20PerMin', description: '20 requêtes par minute' },
          { policyName: '50PerMin', description: '50 requêtes par minute' }
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
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load application details', error);
      }
    });
  }

  /**
   * Close detail view
   */
  closeDetail(): void {
    this.selectedApp = null;
    this.cdr.detectChanges();
  }

  /**
   * Set active tab
   */
  setTab(tab: 'overview' | 'production' | 'sandbox'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  /**
   * Open create modal
   */
  openCreateModal(): void {
    this.newApp = { 
      name: '', 
      description: '', 
      tier: this.availableTiers[0]?.policyName || 'Unlimited' 
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
  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Reload applications
   */
  reload(): void {
    this.loadApplications();
  }
}
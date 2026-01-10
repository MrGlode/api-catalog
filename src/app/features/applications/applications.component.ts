import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

/**
 * Application interface
 */
interface Application {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'blocked';
  tier: string;
  createdAt: string;
  owner: string;
  subscriptionCount: number;
  keys: {
    production?: ApiKeys;
    sandbox?: ApiKeys;
  };
}

/**
 * API Keys interface
 */
interface ApiKeys {
  consumerKey: string;
  consumerSecret: string;
  keyState: 'CREATED' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
  keyType: 'PRODUCTION' | 'SANDBOX';
  supportedGrantTypes: string[];
  callbackUrl?: string;
  token?: {
    accessToken: string;
    validityTime: number;
    scopes: string[];
  };
}

/**
 * Applications Component - Manage user applications
 */
@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.scss'
})
export class ApplicationsComponent implements OnInit {
  
  /**
   * Loading state
   */
  isLoading = true;
  
  /**
   * Applications list
   */
  applications: Application[] = [];
  
  /**
   * Selected application for detail view
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
   * Available tiers
   */
  availableTiers = [
    { id: 'Unlimited', name: 'Unlimited', description: 'Aucune limite de requêtes' },
    { id: '10PerMin', name: '10 par minute', description: '10 requêtes/min' },
    { id: '20PerMin', name: '20 par minute', description: '20 requêtes/min' },
    { id: '50PerMin', name: '50 par minute', description: '50 requêtes/min' }
  ];
  
  /**
   * Visibility toggles for secrets
   */
  showProductionSecret = false;
  showSandboxSecret = false;
  
  /**
   * Copy feedback
   */
  copiedField: string | null = null;

  /**
   * Mock applications data
   */
  private mockApplications: Application[] = [
    {
      id: 'app-001',
      name: 'E-Commerce App',
      description: 'Application principale de la boutique en ligne pour gérer les paiements et les commandes.',
      status: 'active',
      tier: 'Unlimited',
      createdAt: '2025-11-15',
      owner: 'admin',
      subscriptionCount: 3,
      keys: {
        production: {
          consumerKey: 'prod_ck_a1b2c3d4e5f6g7h8i9j0',
          consumerSecret: 'prod_cs_z9y8x7w6v5u4t3s2r1q0',
          keyState: 'APPROVED',
          keyType: 'PRODUCTION',
          supportedGrantTypes: ['client_credentials', 'password'],
          callbackUrl: 'https://myapp.com/callback',
          token: {
            accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
            validityTime: 3600,
            scopes: ['openid', 'profile', 'email']
          }
        },
        sandbox: {
          consumerKey: 'sand_ck_x1y2z3a4b5c6d7e8f9g0',
          consumerSecret: 'sand_cs_p0o9i8u7y6t5r4e3w2q1',
          keyState: 'APPROVED',
          keyType: 'SANDBOX',
          supportedGrantTypes: ['client_credentials'],
          callbackUrl: 'http://localhost:3000/callback'
        }
      }
    },
    {
      id: 'app-002',
      name: 'Mobile Banking',
      description: 'Application mobile pour les services bancaires et les transactions financières.',
      status: 'active',
      tier: '50PerMin',
      createdAt: '2025-12-01',
      owner: 'admin',
      subscriptionCount: 2,
      keys: {
        production: {
          consumerKey: 'prod_ck_m1n2o3p4q5r6s7t8u9v0',
          consumerSecret: 'prod_cs_a0b1c2d3e4f5g6h7i8j9',
          keyState: 'APPROVED',
          keyType: 'PRODUCTION',
          supportedGrantTypes: ['authorization_code', 'refresh_token'],
          callbackUrl: 'mybank://oauth/callback'
        }
      }
    },
    {
      id: 'app-003',
      name: 'Analytics Dashboard',
      description: 'Tableau de bord interne pour visualiser les métriques et KPIs.',
      status: 'inactive',
      tier: '20PerMin',
      createdAt: '2025-12-20',
      owner: 'developer',
      subscriptionCount: 1,
      keys: {
        sandbox: {
          consumerKey: 'sand_ck_d1a2s3h4b5o6a7r8d9',
          consumerSecret: 'sand_cs_t1e2s3t4k5e6y7s8',
          keyState: 'CREATED',
          keyType: 'SANDBOX',
          supportedGrantTypes: ['client_credentials']
        }
      }
    }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  /**
   * Load applications
   */
  loadApplications(): void {
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      this.applications = this.mockApplications;
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 500);
  }

  /**
   * Select application for detail view
   */
  selectApp(app: Application): void {
    this.selectedApp = app;
    this.activeTab = 'overview';
    this.showProductionSecret = false;
    this.showSandboxSecret = false;
    this.cdr.detectChanges();
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
    this.newApp = { name: '', description: '', tier: 'Unlimited' };
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
    
    const newApplication: Application = {
      id: `app-${Date.now()}`,
      name: this.newApp.name,
      description: this.newApp.description,
      status: 'active',
      tier: this.newApp.tier,
      createdAt: new Date().toISOString().split('T')[0],
      owner: 'admin',
      subscriptionCount: 0,
      keys: {}
    };
    
    this.applications.unshift(newApplication);
    this.closeCreateModal();
    this.selectApp(newApplication);
  }

  /**
   * Generate keys for environment
   */
  generateKeys(keyType: 'production' | 'sandbox'): void {
    if (!this.selectedApp) return;
    
    const prefix = keyType === 'production' ? 'prod' : 'sand';
    const newKeys: ApiKeys = {
      consumerKey: `${prefix}_ck_${this.generateRandomString(20)}`,
      consumerSecret: `${prefix}_cs_${this.generateRandomString(20)}`,
      keyState: 'APPROVED',
      keyType: keyType === 'production' ? 'PRODUCTION' : 'SANDBOX',
      supportedGrantTypes: ['client_credentials']
    };
    
    this.selectedApp.keys[keyType] = newKeys;
    
    // Update in list
    const index = this.applications.findIndex(a => a.id === this.selectedApp!.id);
    if (index !== -1) {
      this.applications[index] = { ...this.selectedApp };
    }
    this.cdr.detectChanges();
  }

  /**
   * Regenerate secret
   */
  regenerateSecret(keyType: 'production' | 'sandbox'): void {
    if (!this.selectedApp || !this.selectedApp.keys[keyType]) return;
    
    const prefix = keyType === 'production' ? 'prod' : 'sand';
    this.selectedApp.keys[keyType]!.consumerSecret = `${prefix}_cs_${this.generateRandomString(20)}`;
    this.cdr.detectChanges();
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
  toggleSecretVisibility(keyType: 'production' | 'sandbox'): void {
    if (keyType === 'production') {
      this.showProductionSecret = !this.showProductionSecret;
    } else {
      this.showSandboxSecret = !this.showSandboxSecret;
    }
    this.cdr.detectChanges();
  }

  /**
   * Get status class
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'badge-green';
      case 'inactive': return 'badge-gray';
      case 'blocked': return 'badge-red';
      default: return 'badge-gray';
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'blocked': return 'Bloquée';
      default: return status;
    }
  }

  /**
   * Get key state class
   */
  getKeyStateClass(state: string): string {
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
  maskSecret(secret: string): string {
    if (secret.length <= 8) return '••••••••';
    return secret.substring(0, 4) + '••••••••••••' + secret.substring(secret.length - 4);
  }

  /**
   * Generate random string
   */
  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Delete application
   */
  deleteApp(app: Application, event: Event): void {
    event.stopPropagation();
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${app.name}" ?`)) {
      this.applications = this.applications.filter(a => a.id !== app.id);
      if (this.selectedApp?.id === app.id) {
        this.selectedApp = null;
      }
      this.cdr.detectChanges();
    }
  }
}
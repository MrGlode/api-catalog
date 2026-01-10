import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

/**
 * API item interface for display
 */
interface ApiItem {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'published' | 'deprecated' | 'beta';
  category: string;
  categoryId: string;
  categoryColor: string;
  provider: string;
  rating?: number;
  subscribers?: number;
}

/**
 * Filter interface
 */
interface CategoryFilter {
  id: string;
  label: string;
  color: string;
  count: number;
}

/**
 * API List Component - Catalog page
 */
@Component({
  selector: 'app-api-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './api-list.component.html',
  styleUrls: ['./api-list.component.scss']
})
export class ApiListComponent implements OnInit {
  
  /**
   * Search query
   */
  searchQuery = '';
  
  /**
   * Active category filter
   */
  activeCategory: string | null = null;
  
  /**
   * View mode: grid or list
   */
  viewMode: 'grid' | 'list' = 'grid';
  
  /**
   * Category filters
   */
  categoryFilters: CategoryFilter[] = [
    { id: 'finance', label: 'Finance', color: 'finance', count: 4 },
    { id: 'security', label: 'Sécurité', color: 'security', count: 2 },
    { id: 'communication', label: 'Messagerie', color: 'communication', count: 3 },
    { id: 'data', label: 'Analytics', color: 'data', count: 2 },
    { id: 'integration', label: 'Connecteurs', color: 'integration', count: 2 },
    { id: 'geo', label: 'Géolocalisation', color: 'geo', count: 1 }
  ];
  
  /**
   * All APIs (mock data)
   */
  allApis: ApiItem[] = [
    {
      id: 'payment-api',
      name: 'Payment Gateway API',
      description: 'API de paiement sécurisée pour traiter les transactions par carte bancaire, virement et prélèvement.',
      version: 'v2.1.0',
      status: 'published',
      category: 'Paiements & Finance',
      categoryId: 'finance',
      categoryColor: 'finance',
      provider: 'MYBUSINESS',
      rating: 4.8,
      subscribers: 127
    },
    {
      id: 'invoice-api',
      name: 'Invoice Management API',
      description: 'Gestion complète du cycle de facturation : création, envoi, suivi et relance automatique.',
      version: 'v1.3.0',
      status: 'published',
      category: 'Paiements & Finance',
      categoryId: 'finance',
      categoryColor: 'finance',
      provider: 'MYBUSINESS',
      rating: 4.5,
      subscribers: 89
    },
    {
      id: 'accounting-api',
      name: 'Accounting Sync API',
      description: 'Synchronisation en temps réel avec les principaux logiciels de comptabilité.',
      version: 'v1.0.0',
      status: 'beta',
      category: 'Paiements & Finance',
      categoryId: 'finance',
      categoryColor: 'finance',
      provider: 'MYBUSINESS',
      rating: 4.2,
      subscribers: 34
    },
    {
      id: 'refund-api',
      name: 'Refund Processing API',
      description: 'Traitement des remboursements et gestion des litiges clients.',
      version: 'v1.1.0',
      status: 'published',
      category: 'Paiements & Finance',
      categoryId: 'finance',
      categoryColor: 'finance',
      provider: 'MYBUSINESS',
      rating: 4.6,
      subscribers: 56
    },
    {
      id: 'oauth-api',
      name: 'OAuth 2.0 Service',
      description: 'Service d\'authentification OAuth 2.0 avec support des tokens JWT et refresh tokens.',
      version: 'v1.0.0',
      status: 'published',
      category: 'Auth & Sécurité',
      categoryId: 'security',
      categoryColor: 'security',
      provider: 'MYBUSINESS',
      rating: 4.9,
      subscribers: 203
    },
    {
      id: 'mfa-api',
      name: 'Multi-Factor Auth API',
      description: 'Authentification multi-facteurs par SMS, email, TOTP et WebAuthn.',
      version: 'v2.0.0',
      status: 'published',
      category: 'Auth & Sécurité',
      categoryId: 'security',
      categoryColor: 'security',
      provider: 'MYBUSINESS',
      rating: 4.7,
      subscribers: 145
    },
    {
      id: 'sms-api',
      name: 'SMS Gateway API',
      description: 'Envoi de SMS transactionnels et marketing dans plus de 200 pays.',
      version: 'v3.0.0',
      status: 'published',
      category: 'Messagerie',
      categoryId: 'communication',
      categoryColor: 'communication',
      provider: 'MYBUSINESS',
      rating: 4.6,
      subscribers: 178
    },
    {
      id: 'email-api',
      name: 'Email Delivery API',
      description: 'Envoi d\'emails transactionnels avec tracking et analytics avancés.',
      version: 'v2.5.0',
      status: 'published',
      category: 'Messagerie',
      categoryId: 'communication',
      categoryColor: 'communication',
      provider: 'MYBUSINESS',
      rating: 4.4,
      subscribers: 156
    },
    {
      id: 'push-api',
      name: 'Push Notifications API',
      description: 'Notifications push temps réel pour iOS, Android et Web.',
      version: 'v1.2.0',
      status: 'published',
      category: 'Messagerie',
      categoryId: 'communication',
      categoryColor: 'communication',
      provider: 'MYBUSINESS',
      rating: 4.3,
      subscribers: 98
    },
    {
      id: 'analytics-api',
      name: 'Analytics Engine API',
      description: 'Collecte et analyse de données utilisateur avec rapports personnalisables.',
      version: 'v1.2.0',
      status: 'published',
      category: 'Analytics',
      categoryId: 'data',
      categoryColor: 'data',
      provider: 'MYBUSINESS',
      rating: 4.5,
      subscribers: 112
    },
    {
      id: 'reporting-api',
      name: 'Business Reports API',
      description: 'Génération de rapports métier en PDF, Excel et formats personnalisés.',
      version: 'v1.0.0',
      status: 'published',
      category: 'Analytics',
      categoryId: 'data',
      categoryColor: 'data',
      provider: 'MYBUSINESS',
      rating: 4.1,
      subscribers: 67
    },
    {
      id: 'sap-connector',
      name: 'SAP S/4HANA Connector',
      description: 'Intégration bidirectionnelle avec SAP S/4HANA pour synchronisation des données.',
      version: 'v1.0.0',
      status: 'published',
      category: 'Connecteurs',
      categoryId: 'integration',
      categoryColor: 'integration',
      provider: 'MYBUSINESS',
      rating: 4.4,
      subscribers: 45
    },
    {
      id: 'salesforce-connector',
      name: 'Salesforce Connector',
      description: 'Synchronisation des contacts, opportunités et deals avec Salesforce.',
      version: 'v2.1.0',
      status: 'published',
      category: 'Connecteurs',
      categoryId: 'integration',
      categoryColor: 'integration',
      provider: 'MYBUSINESS',
      rating: 4.6,
      subscribers: 78
    },
    {
      id: 'geocoding-api',
      name: 'Geocoding API',
      description: 'Conversion adresses vers coordonnées GPS et recherche inversée.',
      version: 'v1.5.0',
      status: 'published',
      category: 'Géolocalisation',
      categoryId: 'geo',
      categoryColor: 'geo',
      provider: 'MYBUSINESS',
      rating: 4.7,
      subscribers: 89
    }
  ];
  
  /**
   * Filtered APIs
   */
  filteredApis: ApiItem[] = [];
  
  /**
   * Loading state
   */
  isLoading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Check for query params
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.activeCategory = params['category'];
      }
      if (params['q']) {
        this.searchQuery = params['q'];
      }
      this.filterApis();
    });
  }

  /**
   * Filter APIs based on search and category
   */
  filterApis(): void {
    let result = [...this.allApis];
    
    // Filter by category
    if (this.activeCategory) {
      result = result.filter(api => api.categoryId === this.activeCategory);
    }
    
    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(api => 
        api.name.toLowerCase().includes(query) ||
        api.description.toLowerCase().includes(query) ||
        api.category.toLowerCase().includes(query)
      );
    }
    
    this.filteredApis = result;
    this.cdr.detectChanges();
  }

  /**
   * Handle search input
   */
  onSearch(): void {
    this.updateQueryParams();
    this.filterApis();
  }

  /**
   * Set active category filter
   */
  setCategory(categoryId: string | null): void {
    this.activeCategory = this.activeCategory === categoryId ? null : categoryId;
    this.updateQueryParams();
    this.filterApis();
  }

  /**
   * Set view mode
   */
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    this.cdr.detectChanges();
  }

  /**
   * Update URL query params
   */
  updateQueryParams(): void {
    const queryParams: any = {};
    if (this.activeCategory) {
      queryParams.category = this.activeCategory;
    }
    if (this.searchQuery.trim()) {
      queryParams.q = this.searchQuery;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: ''
    });
  }

  /**
   * Navigate to API detail
   */
  goToApi(apiId: string): void {
    this.router.navigate(['/catalog', apiId]);
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'published': return 'badge-green';
      case 'deprecated': return 'badge-orange';
      case 'beta': return 'badge-blue';
      default: return 'badge-gray';
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'published': return 'Publié';
      case 'deprecated': return 'Déprécié';
      case 'beta': return 'Beta';
      default: return status;
    }
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchQuery = '';
    this.activeCategory = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
    this.filterApis();
  }
}
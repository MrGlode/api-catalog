import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { APIInfo, APICategory } from '../../core/models';
import { forkJoin } from 'rxjs';

/**
 * Display category interface
 */
interface DisplayCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}

/**
 * Display API interface
 */
interface DisplayApi {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor: string;
  version: string;
  createdTime?: string;
  type?: string;
}

/**
 * Home Component - Landing page connected to WSO2
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  
  /**
   * Loading state
   */
  isLoading = true;
  
  /**
   * Statistics
   */
  stats = {
    totalApis: 0,
    totalCategories: 0,
    totalApplications: 0
  };

  /**
   * Categories from WSO2
   */
  categories: DisplayCategory[] = [];

  /**
   * Popular APIs (first 4)
   */
  popularApis: DisplayApi[] = [];

  /**
   * New APIs (sorted by creation date)
   */
  newApis: DisplayApi[] = [];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private applicationService: ApplicationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Load all data from WSO2
   */
  loadData(): void {
    this.isLoading = true;
    
    // Load APIs and categories in parallel
    forkJoin({
      apis: this.apiService.getApis({ limit: 100 }),
      categories: this.apiService.getCategories()
    }).subscribe({
      next: ({ apis, categories }) => {
        const apiList = apis.list || [];
        const categoryList = categories.list || [];
        
        // Update stats
        this.stats.totalApis = apis.count || apiList.length;
        this.stats.totalCategories = categories.count || categoryList.length;
        
        // Map categories
        this.categories = this.mapCategories(categoryList);
        
        // Map APIs for display
        const displayApis = this.mapApis(apiList);
        
        // Popular APIs (first 4)
        this.popularApis = displayApis.slice(0, 4);
        
        // New APIs (sorted by creation date, last 3)
        this.newApis = this.getNewestApis(displayApis, 3);
        
        this.isLoading = false;
        this.cdr.detectChanges();
        
        // Load applications count separately (requires auth)
        this.loadApplicationsCount();
      },
      error: (error) => {
        console.error('Failed to load home data', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Load applications count (only if authenticated)
   */
  loadApplicationsCount(): void {
    // Only load if user is authenticated
    if (!this.authService.isAuthenticated()) {
      return;
    }
    
    this.applicationService.getApplications().subscribe({
      next: (response) => {
        this.stats.totalApplications = response.count || 0;
        this.cdr.detectChanges();
      },
      error: () => {
        // Silently fail
      }
    });
  }

  /**
   * Map WSO2 categories to display format
   */
  mapCategories(categories: APICategory[]): DisplayCategory[] {
    return categories.map(cat => ({
      id: cat.name?.toLowerCase().replace(/\s+/g, '-') || cat.id || '',
      name: cat.name || 'Sans nom',
      description: cat.description || this.getDefaultDescription(cat.name || ''),
      icon: this.getCategoryIcon(cat.name || ''),
      color: this.getCategoryColor(cat.name || ''),
      count: cat.numberOfAPIs || 0
    }));
  }

  /**
   * Map WSO2 APIs to display format
   */
  mapApis(apis: APIInfo[]): DisplayApi[] {
    return apis.map(api => {
      const apiAny = api as any;
      const category = apiAny.categories?.[0] || api.type || 'API';
      
      return {
        id: api.id || '',
        name: api.displayName || api.name || 'Sans nom',
        description: api.description || 'Aucune description disponible.',
        category: category,
        categoryColor: this.getCategoryColor(category),
        version: api.version || '1.0.0',
        createdTime: api.createdTime,
        type: api.type
      };
    });
  }

  /**
   * Get newest APIs sorted by creation date
   */
  getNewestApis(apis: DisplayApi[], count: number): DisplayApi[] {
    return [...apis]
      .sort((a, b) => {
        if (!a.createdTime) return 1;
        if (!b.createdTime) return -1;
        return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
      })
      .slice(0, count);
  }

  /**
   * Get category icon based on name
   */
  getCategoryIcon(name: string): string {
    const lower = name.toLowerCase();
    
    if (lower.includes('payment') || lower.includes('finance') || lower.includes('billing')) {
      return '💳';
    }
    if (lower.includes('auth') || lower.includes('security') || lower.includes('identity')) {
      return '🔐';
    }
    if (lower.includes('message') || lower.includes('notification') || lower.includes('email') || lower.includes('sms')) {
      return '💬';
    }
    if (lower.includes('analytics') || lower.includes('data') || lower.includes('report')) {
      return '📊';
    }
    if (lower.includes('integration') || lower.includes('connect') || lower.includes('erp')) {
      return '🔌';
    }
    if (lower.includes('geo') || lower.includes('location') || lower.includes('map')) {
      return '📍';
    }
    if (lower.includes('storage') || lower.includes('file') || lower.includes('document')) {
      return '📁';
    }
    if (lower.includes('search')) {
      return '🔍';
    }
    if (lower.includes('user') || lower.includes('account') || lower.includes('profile')) {
      return '👤';
    }
    if (lower.includes('order') || lower.includes('commerce') || lower.includes('shop')) {
      return '🛒';
    }
    if (lower.includes('inventory') || lower.includes('stock') || lower.includes('product')) {
      return '📦';
    }
    
    return '📂';
  }

  /**
   * Get category color based on name
   */
  getCategoryColor(name: string): string {
    const lower = name.toLowerCase();
    
    if (lower.includes('payment') || lower.includes('finance') || lower.includes('billing')) {
      return 'finance';
    }
    if (lower.includes('auth') || lower.includes('security') || lower.includes('identity')) {
      return 'security';
    }
    if (lower.includes('message') || lower.includes('notification') || lower.includes('email') || lower.includes('sms')) {
      return 'communication';
    }
    if (lower.includes('analytics') || lower.includes('data') || lower.includes('report')) {
      return 'data';
    }
    if (lower.includes('integration') || lower.includes('connect') || lower.includes('erp')) {
      return 'integration';
    }
    if (lower.includes('geo') || lower.includes('location') || lower.includes('map')) {
      return 'geo';
    }
    
    return 'default';
  }

  /**
   * Get default description for category
   */
  getDefaultDescription(name: string): string {
    const lower = name.toLowerCase();
    
    if (lower.includes('payment') || lower.includes('finance')) {
      return 'Transactions, facturation, comptabilité';
    }
    if (lower.includes('auth') || lower.includes('security')) {
      return 'Authentification, autorisation, SSO';
    }
    if (lower.includes('message') || lower.includes('notification')) {
      return 'SMS, Email, Notifications push';
    }
    if (lower.includes('analytics') || lower.includes('data')) {
      return 'Rapports, métriques, tableaux de bord';
    }
    if (lower.includes('integration') || lower.includes('connect')) {
      return 'ERP, CRM, systèmes tiers';
    }
    if (lower.includes('geo') || lower.includes('location')) {
      return 'Cartes, adresses, itinéraires';
    }
    
    return 'APIs et services';
  }

  /**
   * Format relative date
   */
  formatRelativeDate(dateString?: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays} jours`;
      if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
      if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
      
      return date.toLocaleDateString('fr-FR');
    } catch {
      return '';
    }
  }

  /**
   * Navigate to category
   */
  goToCategory(categoryName: string): void {
    this.router.navigate(['/catalog'], { 
      queryParams: { category: categoryName } 
    });
  }

  /**
   * Navigate to API detail
   */
  goToApi(apiId: string): void {
    this.router.navigate(['/catalog', apiId]);
  }

  /**
   * Navigate to catalog
   */
  goToCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  /**
   * Navigate to documentation
   */
  goToDocs(): void {
    this.router.navigate(['/docs', 'getting-started']);
  }
}
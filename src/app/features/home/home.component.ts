import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { APIInfo, APICategory, ApplicationInfo, Tag } from '../../core/models';
import { forkJoin, Observable } from 'rxjs';

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
  provider: string;
  type?: string;
  createdTime?: string;
  updatedTime?: string;
}

/**
 * Display Tag interface
 */
interface DisplayTag {
  name: string;
  count: number;
}

/**
 * Home Component - Central hub for the application
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  
  // Authentication
  isAuthenticated$!: Observable<boolean>;
  isAuthenticated = false;
  
  // Loading states
  isLoading = true;
  isLoadingApps = false;
  
  // Statistics
  stats = {
    totalApis: 0,
    totalCategories: 0,
    uptime: '99.9%',
    avgResponseTime: '45ms'
  };

  // Data
  categories: DisplayCategory[] = [];
  tags: DisplayTag[] = [];
  recentApis: DisplayApi[] = [];
  applications: ApplicationInfo[] = [];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private applicationService: ApplicationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.isAuthenticated = this.authService.isAuthenticated();
    
    this.loadData();
    
    if (this.isAuthenticated) {
      this.loadApplications();
    }
  }

  /**
   * Load APIs, categories and tags from WSO2
   */
  loadData(): void {
    this.isLoading = true;
    
    forkJoin({
      apis: this.apiService.getApis({ limit: 100 }),
      categories: this.apiService.getCategories(),
      tags: this.apiService.getTags(50)
    }).subscribe({
      next: ({ apis, categories, tags }) => {
        const apiList = apis.list || [];
        const categoryList = categories.list || [];
        const tagList = tags.list || [];
        
        this.stats.totalApis = apis.count || apiList.length;
        this.stats.totalCategories = categories.count || categoryList.length;
        
        this.categories = this.mapCategories(categoryList);
        this.tags = this.mapTags(tagList);
        
        // Get 6 most recent APIs (by updatedTime or createdTime)
        const allApis = this.mapApis(apiList);
        this.recentApis = this.getRecentApis(allApis, 6);
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load data', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Load user applications
   */
  loadApplications(): void {
    this.isLoadingApps = true;
    
    this.applicationService.getApplications({ limit: 10 }).subscribe({
      next: (response) => {
        this.applications = response.list || [];
        this.isLoadingApps = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingApps = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Map WSO2 categories to display format
   */
  mapCategories(categories: APICategory[]): DisplayCategory[] {
    return categories.map(cat => ({
      id: cat.id || '',
      name: cat.name || 'Sans nom',
      description: cat.description || this.getDefaultDescription(cat.name || ''),
      icon: this.getCategoryIcon(cat.name || ''),
      color: this.getCategoryColor(cat.name || ''),
      count: cat.numberOfAPIs || 0
    }));
  }

  /**
   * Map WSO2 tags to display format
   */
  mapTags(tags: Tag[]): DisplayTag[] {
    return tags
      .map(tag => ({
        name: tag.value || '',
        count: tag.count || 0
      }))
      .filter(tag => tag.name); // Filter out empty tags
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
        provider: api.provider || 'Unknown',
        type: api.type,
        createdTime: api.createdTime,
        updatedTime: apiAny.updatedTime || apiAny.lastUpdatedTime
      };
    });
  }

  /**
   * Get most recent APIs sorted by date
   */
  getRecentApis(apis: DisplayApi[], count: number): DisplayApi[] {
    return [...apis]
      .sort((a, b) => {
        const dateA = a.updatedTime || a.createdTime || '';
        const dateB = b.updatedTime || b.createdTime || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, count);
  }

  getCategoryIcon(name: string): string {
    const lower = name.toLowerCase();
    
    // Catégories spécifiques (acronymes internes)
    if (lower === 'adp') return '👥';           // Administration du Personnel
    if (lower === 'dasc') return '🏢';          // Direction Administrative
    if (lower === 'dpas') return '📋';          // Direction des Prestations
    if (lower === 'dse') return '💻';           // Direction des Systèmes
    if (lower === 'transverse') return '🔗';    // Services transverses
    
    // Catégories génériques
    if (lower.includes('payment') || lower.includes('finance') || lower.includes('billing')) return '💳';
    if (lower.includes('auth') || lower.includes('security') || lower.includes('identity')) return '🔐';
    if (lower.includes('message') || lower.includes('notification') || lower.includes('email') || lower.includes('sms')) return '💬';
    if (lower.includes('analytics') || lower.includes('data') || lower.includes('report')) return '📊';
    if (lower.includes('integration') || lower.includes('connect') || lower.includes('erp')) return '🔌';
    if (lower.includes('geo') || lower.includes('location') || lower.includes('map')) return '📍';
    if (lower.includes('storage') || lower.includes('file') || lower.includes('document')) return '📁';
    if (lower.includes('user') || lower.includes('account')) return '👤';
    if (lower.includes('order') || lower.includes('commerce')) return '🛒';
    return '📂';
  }

  getCategoryColor(name: string): string {
    const lower = name.toLowerCase();
    
    // Catégories spécifiques
    if (lower === 'adp') return 'adp';
    if (lower === 'dasc') return 'dasc';
    if (lower === 'dpas') return 'dpas';
    if (lower === 'dse') return 'dse';
    if (lower === 'transverse') return 'transverse';
    
    // Catégories génériques
    if (lower.includes('payment') || lower.includes('finance') || lower.includes('billing')) return 'finance';
    if (lower.includes('auth') || lower.includes('security') || lower.includes('identity')) return 'security';
    if (lower.includes('message') || lower.includes('notification') || lower.includes('email')) return 'communication';
    if (lower.includes('analytics') || lower.includes('data') || lower.includes('report')) return 'data';
    if (lower.includes('integration') || lower.includes('connect')) return 'integration';
    if (lower.includes('geo') || lower.includes('location')) return 'geo';
    return 'default';
  }

  getDefaultDescription(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('payment') || lower.includes('finance')) return 'Transactions, facturation, comptabilité';
    if (lower.includes('auth') || lower.includes('security')) return 'Authentification, autorisation, SSO';
    if (lower.includes('message') || lower.includes('notification')) return 'SMS, Email, Notifications push';
    if (lower.includes('analytics') || lower.includes('data')) return 'Rapports, métriques, tableaux de bord';
    if (lower.includes('integration') || lower.includes('connect')) return 'ERP, CRM, systèmes tiers';
    if (lower.includes('geo') || lower.includes('location')) return 'Cartes, adresses, itinéraires';
    return 'APIs et services';
  }

  goToCategory(categoryName: string): void {
    this.router.navigate(['/catalog'], { queryParams: { category: categoryName } });
  }

  goToApi(apiId: string): void {
    this.router.navigate(['/catalog', apiId]);
  }

  goToApplication(appId: string): void {
    this.router.navigate(['/applications'], { queryParams: { app: appId } });
  }

  goToCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  goToTag(tagName: string): void {
    this.router.navigate(['/catalog'], { queryParams: { tag: tagName } });
  }

  goToApplications(): void {
    this.router.navigate(['/applications']);
  }
}
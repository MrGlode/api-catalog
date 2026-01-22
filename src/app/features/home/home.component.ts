/**
 * Home Component - Central hub for the application
 * Utilise le composant partagé ApiCardComponent
 */
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { APIInfo, ApplicationInfo, Tag, ApiCardData } from '../../core/models';
import { ApiCardComponent } from '../../shared/component/card/api-card.component';
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
  imports: [CommonModule, RouterLink, ApiCardComponent],
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
  recentApis: ApiCardData[] = [];
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
      tags: this.apiService.getTags()
    }).subscribe({
      next: (results) => {
        // Map APIs
        const allApis = results.apis.list || [];
        this.stats.totalApis = allApis.length;
        
        // Get recent APIs (last 6, sorted by date if available)
        this.recentApis = this.mapApisToCardData(
          allApis.slice(0, 6)
        );
        
        // Map categories
        this.categories = (results.categories.list || []).map(cat => ({
          id: cat.name || '',
          name: cat.name || '',
          description: cat.description || '',
          icon: this.getCategoryIcon(cat.name || ''),
          color: this.getCategoryColor(cat.name || ''),
          count: cat.numberOfAPIs || 0
        }));
        this.stats.totalCategories = this.categories.length;
        
        // Map tags
        this.tags = (results.tags.list || []).map((tag: Tag) => ({
          name: tag.value || '',
          count: tag.count || 0
        })).filter(t => t.name).slice(0, 12); // Limit to 12 tags
        
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
    
    this.applicationService.getApplications({ limit: 5 }).subscribe({
      next: (response) => {
        this.applications = response.list || [];
        this.isLoadingApps = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.warn('Could not load applications', error);
        this.isLoadingApps = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Map WSO2 API response to ApiCardData
   */
  mapApisToCardData(apis: APIInfo[]): ApiCardData[] {
    return apis.map(api => {
      // Cast to any for properties that may exist but aren't in APIInfo interface
      const apiAny = api as any;
      const tags: string[] = apiAny.tags || [];
      const category = apiAny.categories?.[0] || 
                       api.businessInformation?.businessOwner || 
                       this.extractCategoryFromTags(tags) || 
                       api.type || 
                       'General';
      const categoryColor = this.getCategoryColor(category);
      
      return {
        id: api.id || '',
        name: api.displayName || api.name || '',
        description: api.description || '',
        version: api.version || '1.0',
        status: (api.lifeCycleStatus?.toLowerCase() || 'published') as ApiCardData['status'],
        category: category,
        categoryId: category.toLowerCase(),
        categoryColor: categoryColor,
        provider: api.provider || 'Unknown',
        rating: api.avgRating || undefined,
        context: api.context || '',
        type: api.type || 'HTTP',
        tags: tags,
        createdTime: api.createdTime,
        updatedTime: apiAny.lastUpdatedTime
      };
    });
  }

  /**
   * Extract category from tags
   */
  extractCategoryFromTags(tags?: string[]): string | null {
    if (!tags || tags.length === 0) return null;
    
    const categoryTags = ['finance', 'security', 'communication', 'data', 'integration', 'geo'];
    const found = tags.find(tag => categoryTags.includes(tag.toLowerCase()));
    
    return found ? found.charAt(0).toUpperCase() + found.slice(1) : null;
  }

  /**
   * Get category icon
   */
  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'finance': '💳',
      'paiements': '💳',
      'payments': '💳',
      'security': '🔐',
      'sécurité': '🔐',
      'auth': '🔐',
      'communication': '💬',
      'messaging': '💬',
      'data': '📊',
      'analytics': '📊',
      'integration': '🔌',
      'connecteurs': '🔌',
      'geo': '📍',
      'géolocalisation': '📍',
      'location': '📍'
    };
    
    return iconMap[category.toLowerCase()] || '📦';
  }

  /**
   * Get category color
   */
  getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      'finance': 'finance',
      'paiements': 'finance',
      'payments': 'finance',
      'security': 'security',
      'sécurité': 'security',
      'auth': 'security',
      'communication': 'communication',
      'messaging': 'communication',
      'data': 'data',
      'analytics': 'data',
      'integration': 'integration',
      'connecteurs': 'integration',
      'geo': 'geo',
      'géolocalisation': 'geo',
      'location': 'geo'
    };
    
    return colorMap[category.toLowerCase()] || 'integration';
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
   * Navigate to category
   */
  goToCategory(categoryName: string): void {
    this.router.navigate(['/catalog'], { queryParams: { category: categoryName } });
  }

  /**
   * Navigate to tag
   */
  goToTag(tagName: string): void {
    this.router.navigate(['/catalog'], { queryParams: { tag: tagName } });
  }

  /**
   * Navigate to application detail
   */
  goToApplication(appId: string): void {
    this.router.navigate(['/applications', appId]);
  }

  /**
   * Get application status class
   */
  getAppStatusClass(status: string | undefined): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'badge-success';
      case 'CREATED': return 'badge-info';
      case 'REJECTED': return 'badge-danger';
      case 'ON_HOLD': return 'badge-warning';
      default: return 'badge-gray';
    }
  }
}
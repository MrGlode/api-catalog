/**
 * API List Component - Catalog page
 * Utilise le composant partagé ApiCardComponent
 */
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { APIInfo, APIList, APICategoryList, Tag, ApiCardData } from '../../../../core/models';
import { ApiCardComponent } from '../../../../shared/component/card/api-card.component';

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
 * Tag filter interface
 */
interface TagFilter {
  name: string;
  count: number;
}

/**
 * API List Component - Catalog page
 */
@Component({
  selector: 'app-api-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ApiCardComponent],
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
   * Active tag filter
   */
  activeTag: string | null = null;
  
  /**
   * View mode: grid or list
   */
  viewMode: 'grid' | 'list' = 'grid';
  
  /**
   * Category filters (loaded dynamically from WSO2)
   */
  categoryFilters: CategoryFilter[] = [];
  
  /**
   * Tag filters (loaded from WSO2)
   */
  tagFilters: TagFilter[] = [];
  
  /**
   * All APIs from WSO2
   */
  allApis: ApiCardData[] = [];
  
  /**
   * Filtered APIs
   */
  filteredApis: ApiCardData[] = [];
  
  /**
   * Loading state
   */
  isLoading = false;
  
  /**
   * Error message
   */
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // Load categories and tags first
    this.loadCategories();
    this.loadTags();
    
    // Check for query params and load APIs accordingly
    this.route.queryParams.subscribe(params => {
      this.activeCategory = params['category'] || null;
      this.activeTag = params['tag'] || null;
      this.searchQuery = params['q'] || '';
      this.loadApis();
    });
  }

  /**
   * Load APIs based on current filters
   */
  loadApis(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    // Use searchApis if we have tag or category filter
    if (this.activeTag || this.activeCategory || this.searchQuery) {
      this.apiService.searchApis(
        this.searchQuery || undefined,
        this.activeCategory || undefined,
        this.activeTag || undefined,
        undefined, // status
        100
      ).subscribe({
        next: (response: APIList) => {
          this.allApis = this.mapApisToCardData(response.list || []);
          this.filteredApis = this.allApis;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load APIs', error);
          this.errorMessage = 'Impossible de charger les APIs. Vérifiez la connexion au serveur.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Load all APIs
      this.apiService.getApis({ limit: 100 }).subscribe({
        next: (response: APIList) => {
          this.allApis = this.mapApisToCardData(response.list || []);
          this.filteredApis = this.allApis;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load APIs', error);
          this.errorMessage = 'Impossible de charger les APIs. Vérifiez la connexion au serveur.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  /**
   * Load categories from WSO2
   */
  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (response: APICategoryList) => {
        this.categoryFilters = (response.list || []).map(cat => ({
          id: cat.name || '',
          label: cat.name || '',
          color: this.getCategoryColor(cat.name || ''),
          count: cat.numberOfAPIs || 0
        }));
      },
      error: (error) => {
        console.warn('Could not load categories', error);
      }
    });
  }

  /**
   * Load tags from WSO2
   */
  loadTags(): void {
    this.apiService.getTags().subscribe({
      next: (response) => {
        this.tagFilters = (response.list || []).map((tag: Tag) => ({
          name: tag.value || '',
          count: tag.count || 0
        })).filter(t => t.name);
      },
      error: (error) => {
        console.warn('Could not load tags', error);
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
        subscribers: undefined,
        thumbnailUri: api.thumbnailUri || undefined,
        context: api.context || '',
        type: api.type || 'HTTP',
        tags: tags
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
   * Get category color based on name
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
   * Handle search input
   */
  onSearch(): void {
    this.updateQueryParams();
    this.filterApis();
  }

  /**
   * Filter APIs based on search query
   */
  filterApis(): void {
    if (!this.searchQuery.trim()) {
      this.filteredApis = this.allApis;
      return;
    }
    
    const query = this.searchQuery.toLowerCase();
    this.filteredApis = this.allApis.filter(api => 
      api.name.toLowerCase().includes(query) ||
      api.description.toLowerCase().includes(query) ||
      api.category.toLowerCase().includes(query) ||
      (api.tags && api.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }

  /**
   * Set category filter
   */
  setCategory(categoryId: string | null): void {
    this.activeCategory = categoryId;
    this.updateQueryParams();
    this.loadApis();
  }

  /**
   * Set tag filter
   */
  setTag(tagName: string | null): void {
    this.activeTag = tagName;
    this.updateQueryParams();
    this.loadApis();
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
    const queryParams: Record<string, string> = {};
    if (this.activeCategory) {
      queryParams['category'] = this.activeCategory;
    }
    if (this.activeTag) {
      queryParams['tag'] = this.activeTag;
    }
    if (this.searchQuery.trim()) {
      queryParams['q'] = this.searchQuery;
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
   * Get active category filter object
   */
  getActiveCategoryFilter(): CategoryFilter | undefined {
    return this.categoryFilters.find(cat => cat.id === this.activeCategory);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchQuery = '';
    this.activeCategory = null;
    this.activeTag = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
    this.loadApis();
  }

  /**
   * Reload APIs
   */
  reload(): void {
    this.loadApis();
  }

  /**
   * Check if any filter is active
   */
  hasActiveFilters(): boolean {
    return !!(this.activeCategory || this.activeTag || this.searchQuery.trim());
  }

  getCategoryIcon(color: string): string {
  const iconMap: Record<string, string> = {
    'finance': '💰',
    'security': '🔒',
    'communication': '📧',
    'data': '📊',
    'integration': '🔗',
    'geo': '🌍'
  };
  
  return iconMap[color] || '📦';
}
}
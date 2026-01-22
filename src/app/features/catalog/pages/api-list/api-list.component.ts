import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { APIInfo, APIList, APICategoryList, Tag } from '../../../../core/models';

/**
 * API item interface for display
 */
interface ApiItem {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'published' | 'deprecated' | 'beta' | 'blocked' | 'retired';
  category: string;
  categoryId: string;
  categoryColor: string;
  provider: string;
  rating?: number;
  subscribers?: number;
  thumbnailUri?: string;
  context?: string;
  type?: string;
  tags?: string[];
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
  imports: [CommonModule, FormsModule],
  templateUrl: './api-list.component.html',
  styleUrls: ['./api-list.component.scss']
})
export class ApiListComponent implements OnInit, OnDestroy {
  
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
  allApis: ApiItem[] = [];
  
  /**
   * Filtered APIs
   */
  filteredApis: ApiItem[] = [];
  
  /**
   * Loading state
   */
  isLoading = false;
  
  /**
   * Error message
   */
  errorMessage: string | null = null;
  
  /**
   * Thumbnail URL cache (apiId -> objectUrl)
   */
  thumbnailCache: Map<string, string> = new Map();

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
  
  ngOnDestroy(): void {
    // Clean up thumbnail object URLs to prevent memory leaks
    this.thumbnailCache.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.thumbnailCache.clear();
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
          this.allApis = this.mapApisToItems(response.list || []);
          this.filteredApis = this.allApis;
          this.isLoading = false;
          this.loadThumbnails();
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
      // No filters, get all APIs
      this.apiService.getApis({ limit: 100 }).subscribe({
        next: (response: APIList) => {
          this.allApis = this.mapApisToItems(response.list || []);
          this.filteredApis = this.allApis;
          this.isLoading = false;
          this.loadThumbnails();
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
  
  // ========================================
  // THUMBNAIL MANAGEMENT
  // ========================================
  
  /**
   * Load thumbnails for all displayed APIs
   */
  loadThumbnails(): void {
    for (const api of this.filteredApis) {
      this.loadThumbnail(api.id);
    }
  }
  
  /**
   * Load thumbnail for a single API
   */
  loadThumbnail(apiId: string): void {
    // Skip if already cached
    if (this.thumbnailCache.has(apiId)) {
      return;
    }
    
    this.apiService.getApiThumbnail(apiId).subscribe({
      next: (blob) => {
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          this.thumbnailCache.set(apiId, url);
          this.cdr.detectChanges();
        }
      },
      error: () => {
        // No thumbnail available, fallback will be used
      }
    });
  }
  
  /**
   * Get thumbnail URL for an API (or null for fallback)
   */
  getThumbnailUrl(apiId: string): string | null {
    return this.thumbnailCache.get(apiId) || null;
  }
  
  /**
   * Check if API has a thumbnail loaded
   */
  hasThumbnail(apiId: string): boolean {
    return this.thumbnailCache.has(apiId);
  }

  /**
   * Load categories from WSO2
   */
  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (response: APICategoryList) => {
        if (response.list && response.list.length > 0) {
          this.categoryFilters = response.list.map((cat, index) => ({
            id: cat.name?.toLowerCase().replace(/\s+/g, '-') || `cat-${index}`,
            label: cat.name || 'Sans catégorie',
            color: this.getCategoryColor(cat.name || ''),
            count: cat.numberOfAPIs || 0
          }));
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.warn('Could not load categories from WSO2, using derived categories', error);
      }
    });
  }

  /**
   * Load tags from WSO2
   */
  loadTags(): void {
    this.apiService.getTags(50).subscribe({
      next: (response) => {
        if (response.list && response.list.length > 0) {
          this.tagFilters = response.list.map(tag => ({
            name: tag.value || '',
            count: tag.count || 0
          })).filter(tag => tag.name);
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.warn('Could not load tags from WSO2', error);
      }
    });
  }

  /**
   * Map WSO2 APIInfo to display ApiItem
   */
  mapApisToItems(apis: APIInfo[]): ApiItem[] {
    return apis.map(api => {
      const apiAny = api as any;
      const category = apiAny.categories?.[0] || api.type || 'API';
      const categoryId = category.toLowerCase().replace(/\s+/g, '-');
      const tags = apiAny.tags || [];
      
      return {
        id: api.id || '',
        name: api.displayName || api.name || 'Sans nom',
        description: api.description || 'Aucune description disponible.',
        version: api.version || '1.0.0',
        status: this.mapLifecycleStatus(api.lifeCycleStatus),
        category: category,
        categoryId: categoryId,
        categoryColor: this.getCategoryColor(categoryId),
        provider: api.provider || 'Unknown',
        rating: api.avgRating ? parseFloat(api.avgRating) : undefined,
        subscribers: undefined,
        thumbnailUri: api.thumbnailUri,
        context: api.context,
        type: api.type,
        tags: tags
      };
    });
  }

  /**
   * Map WSO2 lifecycle status to display status
   */
  mapLifecycleStatus(status?: string): 'published' | 'deprecated' | 'beta' | 'blocked' | 'retired' {
    switch (status?.toUpperCase()) {
      case 'PUBLISHED': return 'published';
      case 'DEPRECATED': return 'deprecated';
      case 'PROTOTYPED': return 'beta';
      case 'BLOCKED': return 'blocked';
      case 'RETIRED': return 'retired';
      default: return 'published';
    }
  }

  /**
   * Get category color based on name/id
   */
  getCategoryColor(category: string): string {
    const lower = category.toLowerCase();
    
    if (lower.includes('finance') || lower.includes('payment') || lower.includes('billing')) {
      return 'finance';
    }
    if (lower.includes('security') || lower.includes('auth') || lower.includes('oauth')) {
      return 'security';
    }
    if (lower.includes('messag') || lower.includes('sms') || lower.includes('email') || lower.includes('notification')) {
      return 'communication';
    }
    if (lower.includes('data') || lower.includes('analytics') || lower.includes('report')) {
      return 'data';
    }
    if (lower.includes('connect') || lower.includes('integration') || lower.includes('sync')) {
      return 'integration';
    }
    if (lower.includes('geo') || lower.includes('location') || lower.includes('map')) {
      return 'geo';
    }
    
    return 'default';
  }

  /**
   * Handle search input
   */
  onSearch(): void {
    this.updateQueryParams();
    this.loadApis();
  }

  /**
   * Set active category filter
   */
  setCategory(categoryId: string | null): void {
    this.activeCategory = this.activeCategory === categoryId ? null : categoryId;
    this.updateQueryParams();
    this.loadApis();
  }

  /**
   * Set active tag filter
   */
  setTag(tagName: string | null): void {
    this.activeTag = this.activeTag === tagName ? null : tagName;
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
    const queryParams: any = {};
    if (this.activeCategory) {
      queryParams.category = this.activeCategory;
    }
    if (this.activeTag) {
      queryParams.tag = this.activeTag;
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
      case 'blocked': return 'badge-red';
      case 'retired': return 'badge-gray';
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
      case 'blocked': return 'Bloqué';
      case 'retired': return 'Retiré';
      default: return status;
    }
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
   * Reload APIs from WSO2
   */
  reload(): void {
    this.loadCategories();
    this.loadTags();
    this.loadApis();
  }
}
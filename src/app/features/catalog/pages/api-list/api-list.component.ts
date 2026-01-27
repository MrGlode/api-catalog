/**
 * API List Component - Catalog page
 */
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { CategoryService, DisplayCategory } from '../../../../core/services/category.service';
import { APIInfo, APIList, Tag, ApiCardData } from '../../../../core/models';
import { ApiCardComponent } from '../../../../shared/component/card/api-card.component';

/**
 * Category filter (extends DisplayCategory)
 */
interface CategoryFilter {
  id: string;
  label: string;
  color: string;
  count: number;
  icon: string;
}

@Component({
  selector: 'app-api-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ApiCardComponent],
  templateUrl: './api-list.component.html',
  styleUrls: ['./api-list.component.scss']
})
export class ApiListComponent implements OnInit {
  
  searchQuery = '';
  activeCategory: string | null = null;
  activeTag: string | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  
  categoryFilters: CategoryFilter[] = [];
  tagFilters: { name: string; count: number }[] = [];
  
  allApis: ApiCardData[] = [];
  filteredApis: ApiCardData[] = [];
  
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    // Load categories via CategoryService (shared cache)
    this.loadCategories();
    this.loadTags();
    
    // Check for query params
    this.route.queryParams.subscribe(params => {
      this.activeCategory = params['category'] || null;
      this.activeTag = params['tag'] || null;
      this.searchQuery = params['q'] || '';
      this.loadApis();
    });
  }

  /**
   * Load categories from CategoryService (cached)
   */
  loadCategories(): void {
    this.categoryService.getCategoriesWithCounts().subscribe({
      next: (categories) => {
        this.categoryFilters = categories.map(cat => ({
          id: cat.name,
          label: cat.name,
          color: cat.color,
          count: cat.count,
          icon: cat.icon
        }));
        this.cdr.detectChanges();
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
   * Load APIs based on current filters
   */
  loadApis(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    if (this.activeTag || this.activeCategory || this.searchQuery) {
      this.apiService.searchApis(
        this.searchQuery || undefined,
        this.activeCategory || undefined,
        this.activeTag || undefined,
        undefined,
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
          this.errorMessage = 'Impossible de charger les APIs.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.apiService.getApis({ limit: 100 }).subscribe({
        next: (response: APIList) => {
          this.allApis = this.mapApisToCardData(response.list || []);
          this.filteredApis = this.allApis;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load APIs', error);
          this.errorMessage = 'Impossible de charger les APIs.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  /**
   * Map WSO2 API response to ApiCardData
   */
  mapApisToCardData(apis: APIInfo[]): ApiCardData[] {
    return apis.map(api => {
      const apiAny = api as any;
      const tags: string[] = apiAny.tags || [];
      const category = apiAny.categories?.[0] || 
                       api.businessInformation?.businessOwner || 
                       this.extractCategoryFromTags(tags) || 
                       api.type || 
                       'General';
      
      return {
        id: api.id || '',
        name: api.displayName || api.name || '',
        description: api.description || '',
        version: api.version || '1.0',
        status: (api.lifeCycleStatus?.toLowerCase() || 'published') as ApiCardData['status'],
        category: category,
        categoryId: category.toLowerCase(),
        categoryColor: this.categoryService.getCategoryColor(category),
        provider: api.provider || 'Unknown',
        rating: api.avgRating || undefined,
        thumbnailUri: api.thumbnailUri || undefined,
        context: api.context || '',
        type: api.type || 'HTTP',
        tags: tags
      };
    });
  }

  extractCategoryFromTags(tags?: string[]): string | null {
    if (!tags || tags.length === 0) return null;
    const categoryTags = ['finance', 'security', 'communication', 'data', 'integration', 'geo'];
    const found = tags.find(tag => categoryTags.includes(tag.toLowerCase()));
    return found ? found.charAt(0).toUpperCase() + found.slice(1) : null;
  }

  // Rest of methods unchanged...
  onSearch(): void {
    this.updateQueryParams();
    this.filterApis();
  }

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

  setCategory(categoryId: string | null): void {
    this.activeCategory = categoryId;
    this.updateQueryParams();
    this.loadApis();
  }

  setTag(tagName: string | null): void {
    this.activeTag = tagName;
    this.updateQueryParams();
    this.loadApis();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    this.cdr.detectChanges();
  }

  updateQueryParams(): void {
    const queryParams: Record<string, string> = {};
    if (this.activeCategory) queryParams['category'] = this.activeCategory;
    if (this.activeTag) queryParams['tag'] = this.activeTag;
    if (this.searchQuery.trim()) queryParams['q'] = this.searchQuery;
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: '' });
  }

  goToApi(apiId: string): void {
    this.router.navigate(['/catalog', apiId]);
  }

  getActiveCategoryFilter(): CategoryFilter | undefined {
    return this.categoryFilters.find(cat => cat.id === this.activeCategory);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.activeCategory = null;
    this.activeTag = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.loadApis();
  }

  reload(): void {
    this.loadApis();
  }

  hasActiveFilters(): boolean {
    return !!(this.activeCategory || this.activeTag || this.searchQuery.trim());
  }
}
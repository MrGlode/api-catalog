/**
 * Category Service
 * Centralized service for API categories with caching
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, tap, catchError, shareReplay, switchMap } from 'rxjs/operators';
import { environment, getApiUrl } from '../../../environments/environment';
import { APICategoryList, APIList } from '../models';

/**
 * Display category with count
 */
export interface DisplayCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  // Cache des catégories
  private categoriesSubject = new BehaviorSubject<DisplayCategory[]>([]);
  private categoriesLoaded = false;
  private countsLoaded = false;

  // Observable public
  categories$ = this.categoriesSubject.asObservable();

  // Cache pour éviter les appels multiples
  private loadingCategories = false;
  private loadingCounts = false;

  constructor(private http: HttpClient) {}

  /**
   * Get categories (with cache)
   */
  getCategories(): Observable<DisplayCategory[]> {
    if (this.categoriesLoaded) {
      return this.categories$;
    }

    if (!this.loadingCategories) {
      this.loadingCategories = true;
      this.loadCategoriesFromApi();
    }

    return this.categories$;
  }

  /**
   * Get categories with counts (loads counts if not already loaded)
   */
  getCategoriesWithCounts(): Observable<DisplayCategory[]> {
    return this.getCategories().pipe(
      tap(() => {
        if (!this.countsLoaded && !this.loadingCounts) {
          this.loadCategoryCounts();
        }
      })
    );
  }

  /**
   * Force reload categories
   */
  refreshCategories(): void {
    this.categoriesLoaded = false;
    this.countsLoaded = false;
    this.loadCategoriesFromApi();
  }

  /**
   * Load categories from WSO2 API
   */
  private loadCategoriesFromApi(): void {
    const url = getApiUrl('/api-categories');

    this.http.get<APICategoryList>(url).subscribe({
      next: (response) => {
        const categories = (response.list || []).map(cat => ({
          id: cat.name || '',
          name: cat.name || '',
          description: cat.description || '',
          icon: this.getCategoryIcon(cat.name || ''),
          color: this.getCategoryColor(cat.name || ''),
          count: 0 // Will be updated by loadCategoryCounts
        }));

        this.categoriesSubject.next(categories);
        this.categoriesLoaded = true;
        this.loadingCategories = false;

        // Auto-load counts
        this.loadCategoryCounts();
      },
      error: (error) => {
        console.error('Failed to load categories', error);
        this.loadingCategories = false;
      }
    });
  }

  /**
   * Load API counts for each category via /search endpoint
   */
  private loadCategoryCounts(): void {
    const categories = this.categoriesSubject.getValue();
    
    if (categories.length === 0 || this.loadingCounts) {
      return;
    }

    this.loadingCounts = true;

    const requests = categories.map(cat =>
      this.getApiCountByCategory(cat.name).pipe(
        map(count => ({ name: cat.name, count })),
        catchError(() => of({ name: cat.name, count: 0 }))
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const countsMap = new Map<string, number>();
        results.forEach(r => countsMap.set(r.name, r.count));

        const updatedCategories = categories.map(cat => ({
          ...cat,
          count: countsMap.get(cat.name) || 0
        }));

        this.categoriesSubject.next(updatedCategories);
        this.countsLoaded = true;
        this.loadingCounts = false;
      },
      error: (error) => {
        console.warn('Failed to load category counts', error);
        this.loadingCounts = false;
      }
    });
  }

  /**
   * Get API count for a specific category
   */
  private getApiCountByCategory(categoryName: string): Observable<number> {
    const url = getApiUrl('/search');
    const params = new HttpParams()
      .set('query', `api-category:${categoryName}`)
      .set('limit', '1')
      .set('offset', '0');

    return this.http.get<APIList>(url, { params }).pipe(
      map(response => response.pagination?.total || response.count || 0)
    );
  }

  /**
   * Get category icon based on name
   */
  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'finance': '💰',
      'paiements': '💳',
      'payments': '💳',
      'security': '🔒',
      'sécurité': '🔐',
      'auth': '🔑',
      'communication': '💬',
      'messaging': '📧',
      'data': '📊',
      'analytics': '📈',
      'integration': '🔗',
      'connecteurs': '🔌',
      'geo': '🌍',
      'géolocalisation': '📍',
      'location': '🗺️',
      'ai': '🤖',
      'intelligence artificielle': '🧠'
    };

    return iconMap[category.toLowerCase()] || '📦';
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
      'location': 'geo',
      'ai': 'ai',
      'intelligence artificielle': 'ai'
    };

    return colorMap[category.toLowerCase()] || 'integration';
  }

  /**
   * Get total APIs count
   */
  getTotalApisCount(): Observable<number> {
    const url = getApiUrl('/apis');
    const params = new HttpParams().set('limit', '1');

    return this.http.get<APIList>(url, { params }).pipe(
      map(response => response.pagination?.total || response.count || 0)
    );
  }
}
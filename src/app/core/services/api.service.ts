/**
 * WSO2 API Service
 * Handles all API-related operations with WSO2 API Manager Devportal
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment, getApiUrl } from '../../../environments/environment';
import { 
  API, 
  APIList, 
  APIQueryParams,
  APICategoryList,
  TagList,
  DocumentList,
  Document,
  RatingList,
  Rating,
  CommentList,
  Comment,
  ThrottlingPolicyList
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {}

  // ========================================
  // APIs
  // ========================================

  /**
   * Get list of APIs
   */
  getApis(params?: APIQueryParams): Observable<APIList> {
    const url = getApiUrl('/apis');
    let httpParams = new HttpParams();

    if (params?.query) {
      httpParams = httpParams.set('query', params.query);
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.offset) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }

    const headers = this.getTenantHeader(params?.xWso2Tenant);

    return this.http.get<APIList>(url, { params: httpParams, headers });
  }

  /**
   * Get API details by ID
   */
  getApiById(apiId: string, tenant?: string): Observable<API> {
    const url = getApiUrl(`/apis/${apiId}`);
    const headers = this.getTenantHeader(tenant);
    
    return this.http.get<API>(url, { headers });
  }

  /**
   * Get API Swagger/OpenAPI definition
   */
  getApiDefinition(apiId: string): Observable<string> {
    const url = getApiUrl(`/apis/${apiId}/swagger`);
    
    return this.http.get(url, { responseType: 'text' });
  }

  /**
   * Get API thumbnail
   */
  getApiThumbnail(apiId: string): Observable<Blob> {
    const url = getApiUrl(`/apis/${apiId}/thumbnail`);
    
    return this.http.get(url, { responseType: 'blob' });
  }

  /**
   * Get API thumbnail URL
   */
  getApiThumbnailUrl(apiId: string): string {
    return getApiUrl(`/apis/${apiId}/thumbnail`);
  }

  // ========================================
  // Documents
  // ========================================

  /**
   * Get documents for an API
   */
  getApiDocuments(apiId: string, limit?: number, offset?: number): Observable<DocumentList> {
    const url = getApiUrl(`/apis/${apiId}/documents`);
    let params = new HttpParams();

    if (limit) params = params.set('limit', limit.toString());
    if (offset) params = params.set('offset', offset.toString());

    return this.http.get<DocumentList>(url, { params });
  }

  /**
   * Get document content
   */
  getDocumentContent(apiId: string, documentId: string): Observable<string> {
    const url = getApiUrl(`/apis/${apiId}/documents/${documentId}/content`);
    
    return this.http.get(url, { responseType: 'text' });
  }

  // ========================================
  // Ratings
  // ========================================

  /**
   * Get API ratings
   */
  getApiRatings(apiId: string, limit?: number, offset?: number): Observable<RatingList> {
    const url = getApiUrl(`/apis/${apiId}/ratings`);
    let params = new HttpParams();

    if (limit) params = params.set('limit', limit.toString());
    if (offset) params = params.set('offset', offset.toString());

    return this.http.get<RatingList>(url, { params });
  }

  /**
   * Get user rating for an API
   */
  getUserRating(apiId: string): Observable<Rating> {
    const url = getApiUrl(`/apis/${apiId}/user-rating`);
    
    return this.http.get<Rating>(url);
  }

  /**
   * Add or update user rating
   */
  addRating(apiId: string, rating: number): Observable<Rating> {
    const url = getApiUrl(`/apis/${apiId}/user-rating`);
    
    return this.http.put<Rating>(url, { rating });
  }

  /**
   * Delete user rating
   */
  deleteRating(apiId: string): Observable<void> {
    const url = getApiUrl(`/apis/${apiId}/user-rating`);
    
    return this.http.delete<void>(url);
  }

  // ========================================
  // Comments
  // ========================================

  /**
   * Get API comments
   */
  getApiComments(
    apiId: string, 
    limit?: number, 
    offset?: number,
    includeReplies?: boolean
  ): Observable<CommentList> {
    const url = getApiUrl(`/apis/${apiId}/comments`);
    let params = new HttpParams();

    if (limit) params = params.set('limit', limit.toString());
    if (offset) params = params.set('offset', offset.toString());
    if (includeReplies) params = params.set('includeCommenterInfo', 'true');

    return this.http.get<CommentList>(url, { params });
  }

  /**
   * Add comment to API
   */
  addComment(apiId: string, content: string, replyTo?: string): Observable<Comment> {
    const url = getApiUrl(`/apis/${apiId}/comments`);
    const body: any = { content };
    
    if (replyTo) {
      body.parentCommentId = replyTo;
    }

    return this.http.post<Comment>(url, body);
  }

  /**
   * Update comment
   */
  updateComment(apiId: string, commentId: string, content: string): Observable<Comment> {
    const url = getApiUrl(`/apis/${apiId}/comments/${commentId}`);
    
    return this.http.patch<Comment>(url, { content });
  }

  /**
   * Delete comment
   */
  deleteComment(apiId: string, commentId: string): Observable<void> {
    const url = getApiUrl(`/apis/${apiId}/comments/${commentId}`);
    
    return this.http.delete<void>(url);
  }

  // ========================================
  // Categories & Tags
  // ========================================

  /**
   * Get all API categories
   */
  getCategories(tenant?: string): Observable<APICategoryList> {
    const url = getApiUrl('/api-categories');
    const headers = this.getTenantHeader(tenant);
    
    return this.http.get<APICategoryList>(url, { headers });
  }

  /**
   * Get all tags
   */
  getTags(limit?: number, offset?: number, tenant?: string): Observable<TagList> {
    const url = getApiUrl('/tags');
    let params = new HttpParams();
    
    if (limit) params = params.set('limit', limit.toString());
    if (offset) params = params.set('offset', offset.toString());
    
    const headers = this.getTenantHeader(tenant);

    return this.http.get<TagList>(url, { params, headers });
  }

  // ========================================
  // Throttling Policies
  // ========================================

  /**
   * Get subscription throttling policies
   */
  getThrottlingPolicies(policyLevel: 'subscription' | 'application'): Observable<ThrottlingPolicyList> {
    const url = getApiUrl(`/throttling-policies/${policyLevel}`);
    
    return this.http.get<ThrottlingPolicyList>(url);
  }

  // ========================================
  // SDK Generation
  // ========================================

  /**
   * Get supported SDK languages
   */
  getSdkLanguages(): Observable<string[]> {
    const url = getApiUrl('/sdk-gen/languages');
    
    return this.http.get<string[]>(url);
  }

  /**
   * Generate SDK for an API
   */
  generateSdk(apiId: string, language: string): Observable<Blob> {
    const url = getApiUrl(`/apis/${apiId}/sdks/${language}`);
    
    return this.http.get(url, { responseType: 'blob' });
  }

  // ========================================
  // Helpers
  // ========================================

  /**
   * Get tenant header if specified
   */
  private getTenantHeader(tenant?: string): HttpHeaders {
    let headers = new HttpHeaders();
    
    if (tenant) {
      headers = headers.set('X-WSO2-Tenant', tenant);
    }
    
    return headers;
  }

  /**
   * Search APIs by various criteria
   */
  searchApis(
    searchTerm?: string,
    category?: string,
    tag?: string,
    status?: string,
    limit?: number,
    offset?: number
  ): Observable<APIList> {
    const queryParts: string[] = [];

    if (searchTerm) {
      queryParts.push(searchTerm);
    }
    if (category) {
      queryParts.push(`category:${category}`);
    }
    if (tag) {
      queryParts.push(`tag:${tag}`);
    }
    if (status) {
      queryParts.push(`status:${status}`);
    }

    return this.getApis({
      query: queryParts.length > 0 ? queryParts.join(' ') : undefined,
      limit,
      offset
    });
  }

  search(query: string, limit: number = 100, offset: number = 0): Observable<APIList> {
    const url = getApiUrl('/search');
    const params = new HttpParams().set('query', query).set('limit', limit.toString()).set('offset', offset.toString());

    return this.http.get<APIList>(url, { params });
  }

  getApiCountByCategory(categoryName: string): Observable<number> {
    const query = `api-category:${categoryName}`;
    return this.search(query, 1, 0).pipe(
      map(response => response.pagination?.total || response.count || 0));
  }

  getApiCountsForCategories(categoryNames: string[]): Observable<Map<string, number>> {
    if (categoryNames.length === 0){
      return of (new Map());
    }

    const requests = categoryNames.map(name =>
      this.getApiCountByCategory(name).pipe(
        map(count => ({ name, count})),
        catchError(() => of ({ name, count: 0 }))
      )
    );

    return forkJoin(requests).pipe(
      map(results => {
        const countsMap = new Map<string, number>();
        results.forEach(r => countsMap.set(r.name, r.count));
        return countsMap;
      })
    )
  }
}
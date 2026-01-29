/**
 * Search Service
 * Service d'indexation et de recherche globale
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { APIInfo, APIList } from '../models';
import {
  SearchableItem,
  SearchResults,
  SearchIndexState,
  SearchConfig,
  DEFAULT_SEARCH_CONFIG
} from '../models/search.model';

/**
 * Interface interne pour les APIs validées (avec id obligatoire)
 */
interface ValidatedAPI {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  context?: string;
  version?: string;
  provider?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  
  // Configuration
  private config: SearchConfig = DEFAULT_SEARCH_CONFIG;
  
  // Index de recherche
  private searchIndex: SearchableItem[] = [];
  
  // État d'indexation
  private indexStateSubject = new BehaviorSubject<SearchIndexState>({
    status: 'idle',
    progress: 0,
    apiCount: 0,
    endpointCount: 0,
    indexedApis: 0
  });
  
  indexState$ = this.indexStateSubject.asObservable();
  
  // Cache des specs OpenAPI déjà chargées
  private specsCache = new Map<string, any>();
  
  constructor(private apiService: ApiService) {}
  
  /**
   * Obtenir l'état actuel de l'index
   */
  get indexState(): SearchIndexState {
    return this.indexStateSubject.value;
  }
  
  /**
   * Vérifier si l'index est prêt
   */
  get isReady(): boolean {
    return this.indexState.status === 'ready';
  }
  
  /**
   * Démarrer l'indexation complète
   */
  startIndexing(): void {
    const currentState = this.indexState;
    
    // Éviter les indexations multiples
    if (currentState.status === 'indexing') {
      return;
    }
    
    this.updateState({
      status: 'indexing',
      progress: 0,
      apiCount: 0,
      endpointCount: 0,
      indexedApis: 0,
      error: undefined
    });
    
    // Charger toutes les APIs (limit élevé pour tout récupérer)
    this.apiService.getApis({ limit: 500 }).subscribe({
      next: (response: APIList) => {
        const apis = response.list || [];
        this.processApis(apis);
      },
      error: (error) => {
        this.updateState({
          status: 'error',
          error: `Erreur lors du chargement des APIs: ${error.message || error}`
        });
      }
    });
  }
  
  /**
   * Traiter et valider les APIs avant indexation
   */
  private processApis(apis: APIInfo[]): void {
    this.searchIndex = [];
    
    // Filtrer et valider les APIs (garder seulement celles avec un id)
    const validApis: ValidatedAPI[] = apis
      .filter((api): api is APIInfo & { id: string } => !!api.id)
      .map(api => ({
        id: api.id,
        name: api.name || api.displayName || 'API sans nom',
        displayName: api.displayName,
        description: api.description,
        context: api.context,
        version: api.version,
        provider: api.provider,
        type: api.type
      }));
    
    const totalApis = validApis.length;
    
    this.updateState({
      apiCount: totalApis,
      progress: 5
    });
    
    // D'abord, indexer les APIs (rapide)
    validApis.forEach(api => {
      this.indexApi(api);
    });
    
    this.updateState({
      progress: 10
    });
    
    // Ensuite, charger les specs OpenAPI en parallèle (par batch pour éviter surcharge)
    this.loadSpecsInBatches(validApis, 5).then(() => {
      this.updateState({
        status: 'ready',
        progress: 100,
        lastIndexed: new Date()
      });
    }).catch(error => {
      // Même en cas d'erreur partielle, on garde l'index des APIs
      this.updateState({
        status: 'ready',
        progress: 100,
        lastIndexed: new Date(),
        error: `Certaines specs n'ont pas pu être chargées: ${error.message || error}`
      });
    });
  }
  
  /**
   * Indexer une API validée
   */
  private indexApi(api: ValidatedAPI): void {
    const searchText = this.buildSearchText([
      api.name,
      api.displayName,
      api.description,
      api.context,
      api.version,
      api.provider,
      api.type
    ]);
    
    const item: SearchableItem = {
      id: `api-${api.id}`,
      type: 'api',
      searchText,
      title: api.displayName || api.name,
      subtitle: api.context,
      description: api.description,
      apiId: api.id,
      apiName: api.displayName || api.name,
      apiContext: api.context || ''
    };
    
    this.searchIndex.push(item);
  }
  
  /**
   * Charger les specs OpenAPI par batch
   */
  private async loadSpecsInBatches(apis: ValidatedAPI[], batchSize: number): Promise<void> {
    const totalApis = apis.length;
    let indexedApis = 0;
    
    for (let i = 0; i < apis.length; i += batchSize) {
      const batch = apis.slice(i, i + batchSize);
      
      // Charger le batch en parallèle
      const observables = batch.map(api => 
        this.loadAndIndexSpec(api).pipe(
          catchError(() => of(null)) // Ignorer les erreurs individuelles
        )
      );
      
      if (observables.length > 0) {
        try {
          await forkJoin(observables).toPromise();
        } catch (e) {
          // Continuer même en cas d'erreur
        }
      }
      
      indexedApis += batch.length;
      const progress = 10 + Math.round((indexedApis / totalApis) * 85);
      
      this.updateState({
        progress,
        indexedApis,
        currentApi: batch[batch.length - 1]?.name
      });
    }
  }
  
  /**
   * Charger et indexer une spec OpenAPI
   */
  private loadAndIndexSpec(api: ValidatedAPI): Observable<void> {
    const apiId = api.id;
    
    // Vérifier le cache
    if (this.specsCache.has(apiId)) {
      this.indexEndpointsFromSpec(api, this.specsCache.get(apiId));
      return of(undefined);
    }
    
    // Utiliser getApiDefinition qui retourne un Observable<string>
    return this.apiService.getApiDefinition(apiId).pipe(
      map((specString: string) => {
        try {
          const spec = JSON.parse(specString);
          this.specsCache.set(apiId, spec);
          this.indexEndpointsFromSpec(api, spec);
        } catch (e) {
          console.warn(`Impossible de parser la spec pour ${api.name}:`, e);
        }
      }),
      catchError(error => {
        console.warn(`Impossible de charger la spec pour ${api.name}:`, error);
        return of(undefined);
      })
    );
  }
  
  /**
   * Indexer les endpoints d'une spec OpenAPI
   */
  private indexEndpointsFromSpec(api: ValidatedAPI, spec: any): void {
    if (!spec?.paths) return;
    
    const apiId = api.id;
    const apiName = api.displayName || api.name;
    const apiContext = api.context || '';
    let endpointCount = 0;
    
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;
      
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
      
      for (const method of methods) {
        const operation = (pathItem as Record<string, any>)[method];
        if (!operation) continue;
        
        const operationTags: string[] = Array.isArray(operation.tags) ? operation.tags : [];
        
        const searchText = this.buildSearchText([
          path,
          method,
          operation.summary,
          operation.description,
          operation.operationId,
          ...operationTags
        ]);
        
        const item: SearchableItem = {
          id: `endpoint-${apiId}-${method}-${path}`,
          type: 'endpoint',
          searchText,
          title: path,
          subtitle: operation.summary,
          description: operation.description,
          apiId: apiId,
          apiName: apiName,
          apiContext: apiContext,
          method: method.toUpperCase(),
          path,
          operationId: operation.operationId,
          tags: operationTags
        };
        
        this.searchIndex.push(item);
        endpointCount++;
      }
    }
    
    // Mettre à jour le compteur d'endpoints
    this.updateState({
      endpointCount: this.indexState.endpointCount + endpointCount
    });
  }
  
  /**
   * Construire le texte de recherche
   */
  private buildSearchText(parts: (string | undefined | null)[]): string {
    return parts
      .filter((p): p is string => typeof p === 'string' && p.length > 0)
      .join(' ')
      .toLowerCase();
  }
  
  /**
   * Mettre à jour l'état
   */
  private updateState(partial: Partial<SearchIndexState>): void {
    this.indexStateSubject.next({
      ...this.indexState,
      ...partial
    });
  }
  
  /**
   * Rechercher dans l'index
   */
  search(query: string): SearchResults {
    const trimmedQuery = query.trim().toLowerCase();
    
    // Résultat vide si query trop courte
    if (trimmedQuery.length < this.config.minQueryLength) {
      return {
        query,
        apis: [],
        endpoints: [],
        totalApis: 0,
        totalEndpoints: 0,
        totalCount: 0,
        hasMore: false
      };
    }
    
    // Séparer les termes de recherche
    const terms = trimmedQuery.split(/\s+/).filter(t => t.length > 0);
    
    // Filtrer les items qui matchent tous les termes
    const matchingItems = this.searchIndex.filter(item =>
      terms.every(term => item.searchText.includes(term))
    );
    
    // Séparer APIs et endpoints
    const allApis = matchingItems.filter(item => item.type === 'api');
    const allEndpoints = matchingItems.filter(item => item.type === 'endpoint');
    
    // Trier par pertinence (items dont le titre contient le query en premier)
    const sortByRelevance = (items: SearchableItem[]): SearchableItem[] => {
      return [...items].sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aContains = aTitle.includes(trimmedQuery);
        const bContains = bTitle.includes(trimmedQuery);
        
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;
        
        // Sinon, trier par position du premier terme dans le titre
        const aPos = aTitle.indexOf(terms[0]);
        const bPos = bTitle.indexOf(terms[0]);
        
        if (aPos !== -1 && bPos !== -1) return aPos - bPos;
        if (aPos !== -1) return -1;
        if (bPos !== -1) return 1;
        
        return 0;
      });
    };
    
    const sortedApis = sortByRelevance(allApis);
    const sortedEndpoints = sortByRelevance(allEndpoints);
    
    // Limiter les résultats
    const apis = sortedApis.slice(0, this.config.maxApiResults);
    const endpoints = sortedEndpoints.slice(0, this.config.maxEndpointResults);
    
    const totalCount = allApis.length + allEndpoints.length;
    const displayedCount = apis.length + endpoints.length;
    
    return {
      query,
      apis,
      endpoints,
      totalApis: allApis.length,
      totalEndpoints: allEndpoints.length,
      totalCount,
      hasMore: displayedCount < totalCount
    };
  }
  
  /**
   * Recherche étendue (tous les résultats)
   */
  searchAll(query: string): SearchResults {
    const trimmedQuery = query.trim().toLowerCase();
    
    if (trimmedQuery.length < this.config.minQueryLength) {
      return {
        query,
        apis: [],
        endpoints: [],
        totalApis: 0,
        totalEndpoints: 0,
        totalCount: 0,
        hasMore: false
      };
    }
    
    const terms = trimmedQuery.split(/\s+/).filter(t => t.length > 0);
    
    const matchingItems = this.searchIndex.filter(item =>
      terms.every(term => item.searchText.includes(term))
    );
    
    const apis = matchingItems.filter(item => item.type === 'api');
    const endpoints = matchingItems.filter(item => item.type === 'endpoint');
    
    return {
      query,
      apis,
      endpoints,
      totalApis: apis.length,
      totalEndpoints: endpoints.length,
      totalCount: apis.length + endpoints.length,
      hasMore: false
    };
  }
  
  /**
   * Réinitialiser l'index
   */
  resetIndex(): void {
    this.searchIndex = [];
    this.specsCache.clear();
    this.updateState({
      status: 'idle',
      progress: 0,
      apiCount: 0,
      endpointCount: 0,
      indexedApis: 0,
      lastIndexed: undefined,
      error: undefined
    });
  }
  
  /**
   * Mettre à jour la configuration
   */
  configure(config: Partial<SearchConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Obtenir les statistiques de l'index
   */
  getStats(): { apis: number; endpoints: number; total: number } {
    const apis = this.searchIndex.filter(i => i.type === 'api').length;
    const endpoints = this.searchIndex.filter(i => i.type === 'endpoint').length;
    return {
      apis,
      endpoints,
      total: apis + endpoints
    };
  }
}
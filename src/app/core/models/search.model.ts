/**
 * Search Models
 * Modèles pour la recherche globale dans le catalogue API
 */

/**
 * Type d'élément recherchable
 */
export type SearchItemType = 'api' | 'endpoint';

/**
 * Élément indexé pour la recherche
 */
export interface SearchableItem {
  // Identification
  id: string;
  type: SearchItemType;
  
  // Contenu searchable (texte concaténé lowercase pour recherche rapide)
  searchText: string;
  
  // Données pour affichage
  title: string;
  subtitle?: string;
  description?: string;
  
  // Navigation
  apiId: string;
  apiName: string;
  apiContext: string;
  
  // Spécifique endpoint
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | string;
  path?: string;
  operationId?: string;
  tags?: string[];
}

/**
 * Résultat de recherche groupé
 */
export interface SearchResults {
  query: string;
  apis: SearchableItem[];
  endpoints: SearchableItem[];
  totalApis: number;
  totalEndpoints: number;
  totalCount: number;
  hasMore: boolean;
}

/**
 * État du service de recherche
 */
export type SearchIndexStatus = 'idle' | 'indexing' | 'ready' | 'error';

export interface SearchIndexState {
  status: SearchIndexStatus;
  progress: number;             // 0-100
  currentApi?: string;          // API en cours d'indexation
  apiCount: number;
  endpointCount: number;
  indexedApis: number;
  lastIndexed?: Date;
  error?: string;
}

/**
 * Configuration de la recherche
 */
export interface SearchConfig {
  maxApiResults: number;
  maxEndpointResults: number;
  debounceMs: number;
  minQueryLength: number;
}

/**
 * Configuration par défaut
 */
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxApiResults: 5,
  maxEndpointResults: 10,
  debounceMs: 250,
  minQueryLength: 2
};
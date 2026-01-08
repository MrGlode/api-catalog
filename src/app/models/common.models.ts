/**
 * Modèles communs utilisés dans toute l'application
 * Basés sur la spécification WSO2 API Manager Devportal v3
 */

/**
 * Informations de pagination pour les listes paginées
 */
export interface Pagination {
  /** Index de départ des résultats */
  offset: number;
  
  /** Nombre maximum d'éléments à retourner */
  limit: number;
  
  /** Nombre total d'éléments disponibles */
  total: number;
  
  /** Lien vers la page suivante */
  next?: string;
  
  /** Lien vers la page précédente */
  previous?: string;
}

/**
 * Erreur retournée par l'API avec un code HTTP 4XX ou 5XX
 */
export interface ApiError {
  /** Code d'erreur */
  code: number;
  
  /** Message d'erreur */
  message: string;
  
  /** Description détaillée de l'erreur */
  description?: string;
  
  /** URL avec plus de détails sur l'erreur */
  moreInfo?: string;
  
  /** Liste d'erreurs supplémentaires si applicable */
  error?: ErrorListItem[];
}

/**
 * Détails d'une erreur individuelle
 */
export interface ErrorListItem {
  /** Code d'erreur spécifique */
  code: string;
  
  /** Description de l'erreur */
  message: string;
}

/**
 * Réponse de workflow pour les approbations
 */
export interface WorkflowResponse {
  /** Statut du workflow */
  workflowStatus: 'CREATED' | 'APPROVED' | 'REJECTED' | 'REGISTERED';
  
  /** Données JSON retournées après l'exécution du workflow */
  jsonPayload?: string;
}

/**
 * Information sur un tag
 */
export interface Tag {
  /** Valeur du tag */
  value: string;
  
  /** Nombre d'APIs associées à ce tag */
  count: number;
}

/**
 * Liste de tags avec pagination
 */
export interface TagList {
  /** Nombre de tags retournés */
  count: number;
  
  /** Liste des tags */
  list: Tag[];
  
  /** Informations de pagination */
  pagination: Pagination;
}
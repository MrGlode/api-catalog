/**
 * Modèles liés à la Documentation
 * Basés sur la spécification WSO2 API Manager Devportal v3
 */

import { Pagination } from './common.models';

/**
 * Type de document
 */
export type DocumentType = 
  | 'HOWTO'           // Guide pratique
  | 'SAMPLES'         // Exemples de code
  | 'PUBLIC_FORUM'    // Forum public
  | 'SUPPORT_FORUM'   // Forum de support
  | 'API_MESSAGE_FORMAT' // Format des messages
  | 'SWAGGER_DOC'     // Documentation Swagger
  | 'OTHER';          // Autre

/**
 * Type de source du document
 */
export type DocumentSourceType = 
  | 'INLINE'    // Contenu inline
  | 'MARKDOWN'  // Contenu Markdown
  | 'URL'       // URL externe
  | 'FILE';     // Fichier uploadé

/**
 * Visibilité du document
 */
export type DocumentVisibility = 
  | 'OWNER_ONLY'  // Visible par le propriétaire uniquement
  | 'PRIVATE'     // Privé
  | 'API_LEVEL';  // Visible au niveau de l'API

/**
 * Document d'une API
 */
export interface Document {
  /** Identifiant du document (UUID) */
  documentId?: string;
  
  /** Nom du document */
  name: string;
  
  /** Type du document */
  type: DocumentType;
  
  /** Résumé du document */
  summary?: string;
  
  /** Type de source du document */
  sourceType: DocumentSourceType;
  
  /** URL de la source (si sourceType = URL) */
  sourceUrl?: string;
  
  /** Nom du type personnalisé (si type = OTHER) */
  otherTypeName?: string;
  
  /** Visibilité du document */
  visibility?: DocumentVisibility;
}

/**
 * Liste de documents avec pagination
 */
export interface DocumentList {
  /** Nombre de documents retournés */
  count: number;
  
  /** Liste des documents */
  list: Document[];
  
  /** Informations de pagination */
  pagination: Pagination;
}

/**
 * Résultat de recherche de document
 */
export interface DocumentSearchResult {
  /** Identifiant du document */
  id: string;
  
  /** Nom du document */
  name: string;
  
  /** Type (toujours "DOC" pour les documents) */
  type: 'DOC';
  
  /** Type du document */
  docType: DocumentType;
  
  /** Résumé du document */
  summary?: string;
  
  /** Type de source */
  sourceType: DocumentSourceType;
  
  /** URL de la source */
  sourceUrl?: string;
  
  /** Nom du type personnalisé */
  otherTypeName?: string;
  
  /** Visibilité */
  visibility: DocumentVisibility;
  
  /** Nom de l'API associée */
  apiName: string;
  
  /** Version de l'API associée */
  apiVersion: string;
  
  /** Fournisseur de l'API */
  apiProvider: string;
  
  /** UUID de l'API */
  apiUUID: string;
}

/**
 * Commentaire sur une API
 */
export interface Comment {
  /** Identifiant du commentaire (UUID) */
  id?: string;
  
  /** Contenu du commentaire (max 512 caractères) */
  content: string;
  
  /** Date de création (lecture seule) */
  createdTime?: string;
  
  /** Auteur du commentaire (lecture seule) */
  createdBy?: string;
  
  /** Date de dernière modification (lecture seule) */
  updatedTime?: string;
  
  /** Catégorie du commentaire */
  category?: string;
  
  /** Identifiant du commentaire parent (pour les réponses) */
  parentCommentId?: string;
  
  /** Point d'entrée (devPortal ou publisher) */
  entryPoint?: 'devPortal' | 'publisher';
  
  /** Informations sur le commentateur */
  commenterInfo?: CommenterInfo;
  
  /** Réponses au commentaire */
  replies?: CommentList;
}

/**
 * Liste de commentaires
 */
export interface CommentList {
  /** Nombre de commentaires retournés */
  count: number;
  
  /** Liste des commentaires */
  list: Comment[];
  
  /** Informations de pagination */
  pagination: Pagination;
}

/**
 * Informations sur un commentateur
 */
export interface CommenterInfo {
  /** Prénom */
  firstName?: string;
  
  /** Nom */
  lastName?: string;
  
  /** Nom complet */
  fullName?: string;
}

/**
 * Notation d'une API
 */
export interface Rating {
  /** Identifiant de la notation (UUID) */
  ratingId?: string;
  
  /** Identifiant de l'API */
  apiId?: string;
  
  /** Utilisateur ayant noté */
  ratedBy?: string;
  
  /** Note (généralement entre 1 et 5) */
  rating: number;
}

/**
 * Liste de notations avec moyenne
 */
export interface RatingList {
  /** Note moyenne de l'API */
  avgRating: string;
  
  /** Note donnée par l'utilisateur actuel */
  userRating?: number;
  
  /** Nombre de notations retournées */
  count: number;
  
  /** Liste des notations */
  list: Rating[];
  
  /** Informations de pagination */
  pagination: Pagination;
}
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import {
  API,
  APIList,
  APIInfo,
  APISearchParams,
  APICategory,
  APICategoryList,
  DocumentList,
  Document,
  CommentList,
  Comment,
  RatingList,
  Rating
} from '../../models';

/**
 * Service de gestion des API
 * Fournit toutes les opérations CRUD sur les API WSO2
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService extends BaseApiService {
  /**
   * Récupère la liste des API avec filtres et pagination
   * @param params - Paramètres de recherche
   * @returns Observable de la liste d'API
   */
  getApis(params?: APISearchParams): Observable<APIList> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.query) {
        httpParams = httpParams.set('query', params.query);
      }
      if (params.limit !== undefined) {
        httpParams = httpParams.set('limit', params.limit.toString());
      }
      if (params.offset !== undefined) {
        httpParams = httpParams.set('offset', params.offset.toString());
      }
    }

    return this.get<APIList>('/apis', { params: httpParams });
  }

  /**
   * Récupère les détails complets d'une API
   * @param apiId - Identifiant de l'API
   * @returns Observable de l'API
   */
  getApiById(apiId: string): Observable<API> {
    return this.get<API>(`/apis/${apiId}`);
  }

  /**
   * Récupère la définition Swagger/OpenAPI d'une API
   * @param apiId - Identifiant de l'API
   * @returns Observable de la définition (string JSON)
   */
  getApiSwagger(apiId: string): Observable<any> {
    return this.get<any>(`/apis/${apiId}/swagger`);
  }

  /**
   * Récupère la miniature d'une API
   * @param apiId - Identifiant de l'API
   * @returns Observable du blob de l'image
   */
  getApiThumbnail(apiId: string): Observable<Blob> {
    return this.get<Blob>(`/apis/${apiId}/thumbnail`, { 
      responseType: 'blob' as any 
    });
  }

  /**
   * Recherche des API par critères avancés
   * @param query - Requête de recherche (ex: "provider:admin", "status:PUBLISHED")
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste d'API
   */
  searchApis(query: string, limit?: number, offset?: number): Observable<APIList> {
    return this.getApis({ query, limit, offset });
  }

  /**
   * Récupère les catégories d'API disponibles
   * @returns Observable de la liste des catégories
   */
  getApiCategories(): Observable<APICategoryList> {
    return this.get<APICategoryList>('/api-categories');
  }

  /**
   * Récupère les API d'une catégorie spécifique
   * @param categoryId - Identifiant de la catégorie
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste d'API
   */
  getApisByCategory(
    categoryId: string, 
    limit?: number, 
    offset?: number
  ): Observable<APIList> {
    const params = this.buildPaginationParams(limit, offset);
    return this.get<APIList>(`/api-categories/${categoryId}/apis`, { params });
  }

  // ==================== DOCUMENTATION ====================

  /**
   * Récupère la liste des documents d'une API
   * @param apiId - Identifiant de l'API
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste de documents
   */
  getApiDocuments(apiId: string, limit?: number, offset?: number): Observable<DocumentList> {
    const params = this.buildPaginationParams(limit, offset);
    return this.get<DocumentList>(`/apis/${apiId}/documents`, { params });
  }

  /**
   * Récupère un document spécifique
   * @param apiId - Identifiant de l'API
   * @param documentId - Identifiant du document
   * @returns Observable du document
   */
  getApiDocument(apiId: string, documentId: string): Observable<Document> {
    return this.get<Document>(`/apis/${apiId}/documents/${documentId}`);
  }

  /**
   * Récupère le contenu d'un document
   * @param apiId - Identifiant de l'API
   * @param documentId - Identifiant du document
   * @returns Observable du contenu (string ou blob selon le type)
   */
  getApiDocumentContent(apiId: string, documentId: string): Observable<any> {
    return this.get<any>(`/apis/${apiId}/documents/${documentId}/content`);
  }

  // ==================== COMMENTAIRES ====================

  /**
   * Récupère les commentaires d'une API
   * @param apiId - Identifiant de l'API
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste de commentaires
   */
  getApiComments(apiId: string, limit?: number, offset?: number): Observable<CommentList> {
    const params = this.buildPaginationParams(limit, offset);
    return this.get<CommentList>(`/apis/${apiId}/comments`, { params });
  }

  /**
   * Ajoute un commentaire à une API
   * @param apiId - Identifiant de l'API
   * @param content - Contenu du commentaire
   * @param parentCommentId - ID du commentaire parent (pour les réponses)
   * @returns Observable du commentaire créé
   */
  addApiComment(
    apiId: string, 
    content: string, 
    parentCommentId?: string
  ): Observable<Comment> {
    const body: Partial<Comment> = { content };
    if (parentCommentId) {
      body.parentCommentId = parentCommentId;
    }
    return this.post<Comment>(`/apis/${apiId}/comments`, body);
  }

  /**
   * Récupère un commentaire spécifique
   * @param apiId - Identifiant de l'API
   * @param commentId - Identifiant du commentaire
   * @returns Observable du commentaire
   */
  getApiComment(apiId: string, commentId: string): Observable<Comment> {
    return this.get<Comment>(`/apis/${apiId}/comments/${commentId}`);
  }

  /**
   * Modifie un commentaire
   * @param apiId - Identifiant de l'API
   * @param commentId - Identifiant du commentaire
   * @param content - Nouveau contenu
   * @returns Observable du commentaire modifié
   */
  updateApiComment(apiId: string, commentId: string, content: string): Observable<Comment> {
    return this.put<Comment>(`/apis/${apiId}/comments/${commentId}`, { content });
  }

  /**
   * Supprime un commentaire
   * @param apiId - Identifiant de l'API
   * @param commentId - Identifiant du commentaire
   * @returns Observable vide
   */
  deleteApiComment(apiId: string, commentId: string): Observable<void> {
    return this.delete<void>(`/apis/${apiId}/comments/${commentId}`);
  }

  /**
   * Récupère les réponses à un commentaire
   * @param apiId - Identifiant de l'API
   * @param commentId - Identifiant du commentaire
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste de réponses
   */
  getCommentReplies(
    apiId: string, 
    commentId: string, 
    limit?: number, 
    offset?: number
  ): Observable<CommentList> {
    const params = this.buildPaginationParams(limit, offset);
    return this.get<CommentList>(`/apis/${apiId}/comments/${commentId}/replies`, { params });
  }

  // ==================== NOTATIONS ====================

  /**
   * Récupère les notations d'une API
   * @param apiId - Identifiant de l'API
   * @param limit - Nombre maximum de résultats
   * @param offset - Offset pour la pagination
   * @returns Observable de la liste de notations
   */
  getApiRatings(apiId: string, limit?: number, offset?: number): Observable<RatingList> {
    const params = this.buildPaginationParams(limit, offset);
    return this.get<RatingList>(`/apis/${apiId}/ratings`, { params });
  }

  /**
   * Récupère la notation de l'utilisateur courant
   * @param apiId - Identifiant de l'API
   * @returns Observable de la notation
   */
  getUserApiRating(apiId: string): Observable<Rating> {
    return this.get<Rating>(`/apis/${apiId}/user-rating`);
  }

  /**
   * Ajoute ou met à jour la notation de l'utilisateur
   * @param apiId - Identifiant de l'API
   * @param rating - Note (généralement 1-5)
   * @returns Observable de la notation
   */
  rateApi(apiId: string, rating: number): Observable<Rating> {
    return this.put<Rating>(`/apis/${apiId}/user-rating`, { rating });
  }

  /**
   * Supprime la notation de l'utilisateur
   * @param apiId - Identifiant de l'API
   * @returns Observable vide
   */
  deleteUserApiRating(apiId: string): Observable<void> {
    return this.delete<void>(`/apis/${apiId}/user-rating`);
  }
}
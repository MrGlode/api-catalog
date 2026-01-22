/**
 * API Card Data Model
 * Interface commune pour l'affichage des cartes API
 */
export interface ApiCardData {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'published' | 'deprecated' | 'beta' | 'blocked' | 'retired' | string;
  category: string;
  categoryId?: string;
  categoryColor: string;
  provider: string;
  rating?: number | string;
  subscribers?: number;
  thumbnailUri?: string;
  context?: string;
  type?: string;
  tags?: string[];
  createdTime?: string;
  updatedTime?: string;
}
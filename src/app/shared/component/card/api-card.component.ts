/**
 * API Card Component
 * Composant réutilisable pour l'affichage des cartes API
 * Supporte les modes grid (tuile) et list (ligne)
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiCardData } from '../../../core/models/api-card.model';

@Component({
  selector: 'app-api-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './api-card.component.html',
  styleUrls: ['./api-card.component.scss']
})
export class ApiCardComponent {
  
  /**
   * Données de l'API à afficher
   */
  @Input({ required: true }) api!: ApiCardData;
  
  /**
   * Mode d'affichage : grid (tuile) ou list (ligne)
   */
  @Input() viewMode: 'grid' | 'list' = 'grid';
  
  /**
   * Afficher la note (rating)
   */
  @Input() showRating = true;
  
  /**
   * Afficher le provider
   */
  @Input() showProvider = false;
  
  /**
   * Afficher le badge de statut
   */
  @Input() showStatus = true;
  
  /**
   * Afficher la version
   */
  @Input() showVersion = true;
  
  /**
   * Événement émis lors du clic sur la carte
   */
  @Output() cardClick = new EventEmitter<string>();

  /**
   * Gestion du clic sur la carte
   */
  onClick(): void {
    this.cardClick.emit(this.api.id);
  }

  /**
   * Retourne la classe CSS pour le statut
   */
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'badge-success';
      case 'deprecated':
        return 'badge-warning';
      case 'beta':
        return 'badge-info';
      case 'blocked':
      case 'retired':
        return 'badge-danger';
      default:
        return 'badge-gray';
    }
  }

  /**
   * Retourne le libellé pour le statut
   */
  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'Publié';
      case 'deprecated':
        return 'Déprécié';
      case 'beta':
        return 'Beta';
      case 'blocked':
        return 'Bloqué';
      case 'retired':
        return 'Retiré';
      default:
        return status || 'N/A';
    }
  }
}
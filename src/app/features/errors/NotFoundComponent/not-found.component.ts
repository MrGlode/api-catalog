import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

/**
 * Composant pour la page 404 - Page non trouvée
 * 
 * Affiché quand l'utilisateur accède à une URL qui n'existe pas
 * Design moderne avec animation et suggestions de navigation
 * 
 * @standalone
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {
  /**
   * URL demandée qui n'a pas été trouvée
   */
  requestedUrl: string;

  /**
   * Suggestions de pages à visiter
   */
  suggestions = [
    { 
      title: 'Catalogue API', 
      description: 'Découvrez toutes nos API disponibles',
      url: '/catalog',
      icon: '📚'
    },
    { 
      title: 'Documentation', 
      description: 'Guides et tutoriels pour bien démarrer',
      url: '/documentation',
      icon: '📖'
    },
    { 
      title: 'Dashboard', 
      description: 'Accédez à votre espace personnel',
      url: '/dashboard',
      icon: '📊'
    },
    { 
      title: 'Support', 
      description: 'Besoin d\'aide ? Contactez notre équipe',
      url: '/support',
      icon: '🛟'
    }
  ];

  constructor(private router: Router) {
    // Récupérer l'URL demandée
    this.requestedUrl = this.router.url;
  }

  /**
   * Retour à la page d'accueil
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Retour à la page précédente
   */
  goBack(): void {
    window.history.back();
  }

  /**
   * Navigation vers une suggestion
   */
  navigateTo(url: string): void {
    this.router.navigate([url]);
  }
}
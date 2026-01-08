import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConfigService } from '../../../core/services/config.service';

/**
 * Composant pour les erreurs de configuration WSO2
 * 
 * Affiché quand :
 * - La connexion à WSO2 API Manager échoue
 * - Les credentials OAuth2 sont invalides
 * - Les endpoints WSO2 sont inaccessibles
 * 
 * @standalone
 */
@Component({
  selector: 'app-config-error',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './config-error.component.html',
  styleUrl: './config-error.component.scss'
})
export class ConfigErrorComponent implements OnInit {
  /**
   * Détails de l'erreur de configuration
   */
  errorDetails: any = {};

  /**
   * Étapes de diagnostic
   */
  diagnosticSteps = [
    {
      title: 'Vérifier WSO2 API Manager',
      checks: [
        'WSO2 API Manager est-il démarré ?',
        'Le port 9443 est-il accessible ?',
        'Les certificats SSL sont-ils valides ?'
      ],
      status: 'pending' // pending | checking | success | error
    },
    {
      title: 'Vérifier les credentials OAuth2',
      checks: [
        'Client ID configuré correctement',
        'Client Secret valide',
        'Scopes autorisés'
      ],
      status: 'pending'
    },
    {
      title: 'Vérifier les endpoints',
      checks: [
        'URL du DevPortal API accessible',
        'URL du Token endpoint accessible',
        'CORS configuré correctement'
      ],
      status: 'pending'
    }
  ];

  /**
   * Configuration actuelle
   */
  currentConfig: any = {};

  /**
   * État du diagnostic
   */
  isDiagnosing = false;

  constructor(
    private router: Router,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    // Récupérer la configuration actuelle
    this.loadCurrentConfig();
    
    // Récupérer les détails de l'erreur depuis l'état de navigation
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.errorDetails = navigation.extras.state;
    }
  }

  /**
   * Charger la configuration actuelle
   */
  loadCurrentConfig(): void {
    this.currentConfig = {
      baseUrl: this.configService.baseUrl,
      clientId: this.configService.clientId,
      devportalUrl: this.configService.devportalApiUrl
    };
  }

  /**
   * Lancer le diagnostic automatique
   */
  async runDiagnostic(): Promise<void> {
    this.isDiagnosing = true;

    for (let step of this.diagnosticSteps) {
      step.status = 'checking';
      
      // Simuler la vérification (à remplacer par de vraies vérifications)
      await this.delay(1500);
      
      // Résultat aléatoire pour la démo
      step.status = Math.random() > 0.3 ? 'success' : 'error';
    }

    this.isDiagnosing = false;
  }

  /**
   * Réessayer la connexion
   */
  retry(): void {
    // Recharger la configuration
    window.location.reload();
  }

  /**
   * Aller aux paramètres
   */
  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  /**
   * Copier les détails de l'erreur
   */
  copyErrorDetails(): void {
    const details = JSON.stringify({
      error: this.errorDetails,
      config: this.currentConfig,
      timestamp: new Date().toISOString()
    }, null, 2);

    navigator.clipboard.writeText(details).then(() => {
      // Feedback visuel (à implémenter avec un toast/snackbar)
      console.log('Détails copiés dans le presse-papier');
    });
  }

  /**
   * Utilitaire de délai
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtenir l'icône selon le statut
   */
  getStatusIcon(status: string): string {
    switch(status) {
      case 'pending': return '⏳';
      case 'checking': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  }
}
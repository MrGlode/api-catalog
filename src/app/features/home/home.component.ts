import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

/**
 * Category interface
 */
interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}

/**
 * Popular API interface
 */
interface PopularApi {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor: string;
  version: string;
}

/**
 * New API interface
 */
interface NewApi {
  id: string;
  name: string;
  description: string;
  date: string;
  category: string;
  categoryColor: string;
}

/**
 * Home Component - Landing page with hero, categories, popular APIs
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  
  /**
   * Statistics
   */
  stats = {
    totalApis: 14,
    uptime: '99.9%',
    connectedApps: 150
  };

  /**
   * Categories
   */
  categories: Category[] = [
    {
      id: 'finance',
      name: 'Paiements & Finance',
      description: 'Transactions, facturation, comptabilité',
      icon: '💳',
      color: 'finance',
      count: 4
    },
    {
      id: 'security',
      name: 'Auth & Sécurité',
      description: 'Authentification, autorisation, SSO',
      icon: '🔐',
      color: 'security',
      count: 2
    },
    {
      id: 'communication',
      name: 'Messagerie',
      description: 'SMS, Email, Notifications push',
      icon: '💬',
      color: 'communication',
      count: 3
    },
    {
      id: 'data',
      name: 'Analytics',
      description: 'Rapports, métriques, tableaux de bord',
      icon: '📊',
      color: 'data',
      count: 2
    },
    {
      id: 'integration',
      name: 'Connecteurs',
      description: 'ERP, CRM, systèmes tiers',
      icon: '🔌',
      color: 'integration',
      count: 2
    },
    {
      id: 'geo',
      name: 'Géolocalisation',
      description: 'Cartes, adresses, itinéraires',
      icon: '📍',
      color: 'geo',
      count: 1
    }
  ];

  /**
   * Popular APIs
   */
  popularApis: PopularApi[] = [
    {
      id: 'payment-api',
      name: 'Payment Gateway',
      description: 'Acceptez les paiements de vos clients en toute simplicité',
      category: 'Finance',
      categoryColor: 'finance',
      version: 'v2.1'
    },
    {
      id: 'oauth-api',
      name: 'OAuth 2.0 Service',
      description: 'Authentification sécurisée pour vos applications',
      category: 'Sécurité',
      categoryColor: 'security',
      version: 'v1.0'
    },
    {
      id: 'sms-api',
      name: 'SMS Gateway',
      description: 'Envoyez des SMS à vos utilisateurs dans le monde entier',
      category: 'Messagerie',
      categoryColor: 'communication',
      version: 'v3.0'
    },
    {
      id: 'analytics-api',
      name: 'Analytics Engine',
      description: 'Obtenez des insights sur l\'utilisation de vos services',
      category: 'Data',
      categoryColor: 'data',
      version: 'v1.2'
    }
  ];

  /**
   * New APIs
   */
  newApis: NewApi[] = [
    {
      id: 'invoice-api',
      name: 'Invoice Management API',
      description: 'Gestion complète du cycle de facturation',
      date: 'Il y a 2 jours',
      category: 'Finance',
      categoryColor: 'finance'
    },
    {
      id: 'push-api',
      name: 'Push Notifications API',
      description: 'Notifications temps réel multi-plateforme',
      date: 'Il y a 5 jours',
      category: 'Messagerie',
      categoryColor: 'communication'
    },
    {
      id: 'erp-connector',
      name: 'SAP Connector',
      description: 'Intégration native avec SAP S/4HANA',
      date: 'Il y a 1 semaine',
      category: 'Intégration',
      categoryColor: 'integration'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Load real data from API service when available
  }

  /**
   * Navigate to category
   */
  goToCategory(categoryId: string): void {
    this.router.navigate(['/catalog'], { 
      queryParams: { category: categoryId } 
    });
  }

  /**
   * Navigate to API detail
   */
  goToApi(apiId: string): void {
    this.router.navigate(['/catalog', apiId]);
  }

  /**
   * Navigate to catalog
   */
  goToCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  /**
   * Navigate to documentation
   */
  goToDocs(): void {
    this.router.navigate(['/docs', 'getting-started']);
  }
}
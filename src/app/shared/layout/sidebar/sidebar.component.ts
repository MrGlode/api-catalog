import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';

/**
 * Navigation item interface
 */
interface NavItem {
  label: string;
  path: string;
  icon?: string;
  badge?: string;
  children?: NavItem[];
  requiresAuth?: boolean;
}

/**
 * Category item interface
 */
interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  count?: number;
}

/**
 * Sidebar Component - GitBook style navigation
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  @Output() closeSidebar = new EventEmitter<void>();
  
  isAuthenticated$!: Observable<boolean>;
  searchQuery = '';
  
  /**
   * Main navigation items
   */
  mainNavItems: NavItem[] = [
    { label: 'Accueil', path: '/home', icon: 'home' },
    { label: 'Catalogue API', path: '/catalog', icon: 'grid' },
  ];
  
  /**
   * User navigation items (requires auth)
   */
  userNavItems: NavItem[] = [
    { label: 'Mes Applications', path: '/applications', icon: 'box', requiresAuth: true },
    { label: 'Mes Souscriptions', path: '/subscriptions', icon: 'link', requiresAuth: true },
  ];
  
  /**
   * API Categories
   */
  categories: CategoryItem[] = [
    { id: 'finance', label: 'Paiements & Finance', icon: '💳', color: 'finance', count: 4 },
    { id: 'security', label: 'Auth & Sécurité', icon: '🔐', color: 'security', count: 2 },
    { id: 'communication', label: 'Messagerie', icon: '💬', color: 'communication', count: 3 },
    { id: 'data', label: 'Analytics', icon: '📊', color: 'data', count: 2 },
    { id: 'integration', label: 'Connecteurs', icon: '🔌', color: 'integration', count: 2 },
    { id: 'geo', label: 'Géolocalisation', icon: '📍', color: 'geo', count: 1 },
  ];
  
  /**
   * Resource links
   */
  resourceLinks: NavItem[] = [
    { label: 'Documentation', path: '/docs', icon: 'book' },
    { label: 'Guide de démarrage', path: '/docs/getting-started', icon: 'rocket' },
    { label: 'Changelog', path: '/changelog', icon: 'clock' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  /**
   * Navigate to category
   */
  navigateToCategory(categoryId: string): void {
    this.router.navigate(['/catalog'], { 
      queryParams: { category: categoryId } 
    });
    this.closeSidebar.emit();
  }

  /**
   * Handle search
   */
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    
    if (this.searchQuery.length >= 2) {
      this.router.navigate(['/catalog'], { 
        queryParams: { q: this.searchQuery } 
      });
    }
  }

  /**
   * Handle search on Enter key
   */
  onSearchKeyup(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.searchQuery.length >= 2) {
      this.router.navigate(['/catalog'], { 
        queryParams: { q: this.searchQuery } 
      });
      this.closeSidebar.emit();
    }
  }

  /**
   * Close sidebar (mobile)
   */
  onClose(): void {
    this.closeSidebar.emit();
  }

  /**
   * Navigate and close sidebar
   */
  onNavigate(): void {
    this.closeSidebar.emit();
  }
}

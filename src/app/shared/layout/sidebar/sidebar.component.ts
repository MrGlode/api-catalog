import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { APICategory } from '../../../core/models';
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
 * Sidebar Component - GitBook style navigation
 * Connected to WSO2 for categories
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
  ];
  
  /**
   * API Categories from WSO2
   */
  categories: APICategory[] = [];
  isLoadingCategories = false;
  
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
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.loadCategories();
  }

  /**
   * Load categories from WSO2
   */
  loadCategories(): void {
    this.isLoadingCategories = true;
    
    this.apiService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.list || [];
        this.isLoadingCategories = false;
      },
      error: (error) => {
        console.warn('Could not load categories from WSO2', error);
        this.isLoadingCategories = false;
        // Keep empty array - no fallback mock data
      }
    });
  }

  /**
   * Navigate to category
   */
  navigateToCategory(categoryName: string): void {
    this.router.navigate(['/catalog'], { 
      queryParams: { category: categoryName } 
    });
    this.closeSidebar.emit();
  }

  /**
   * Get category icon based on name
   */
  getCategoryIcon(category: APICategory): string {
    const name = (category.name || '').toLowerCase();
    
    if (name.includes('payment') || name.includes('finance') || name.includes('billing')) {
      return '💳';
    }
    if (name.includes('auth') || name.includes('security') || name.includes('identity')) {
      return '🔐';
    }
    if (name.includes('message') || name.includes('notification') || name.includes('email') || name.includes('sms')) {
      return '💬';
    }
    if (name.includes('analytics') || name.includes('data') || name.includes('report')) {
      return '📊';
    }
    if (name.includes('integration') || name.includes('connect')) {
      return '🔌';
    }
    if (name.includes('geo') || name.includes('location') || name.includes('map')) {
      return '📍';
    }
    if (name.includes('storage') || name.includes('file') || name.includes('document')) {
      return '📁';
    }
    if (name.includes('search')) {
      return '🔍';
    }
    if (name.includes('user') || name.includes('account') || name.includes('profile')) {
      return '👤';
    }
    if (name.includes('order') || name.includes('commerce') || name.includes('shop')) {
      return '🛒';
    }
    if (name.includes('inventory') || name.includes('stock') || name.includes('product')) {
      return '📦';
    }
    if (name.includes('hr') || name.includes('employee') || name.includes('staff')) {
      return '👥';
    }
    if (name.includes('crm') || name.includes('customer') || name.includes('client')) {
      return '🤝';
    }
    
    // Default icon
    return '📂';
  }

  /**
   * Get category color class based on name
   */
  getCategoryColor(category: APICategory): string {
    const name = (category.name || '').toLowerCase();
    
    if (name.includes('payment') || name.includes('finance') || name.includes('billing')) {
      return 'finance';
    }
    if (name.includes('auth') || name.includes('security') || name.includes('identity')) {
      return 'security';
    }
    if (name.includes('message') || name.includes('notification') || name.includes('email')) {
      return 'communication';
    }
    if (name.includes('analytics') || name.includes('data') || name.includes('report')) {
      return 'data';
    }
    if (name.includes('integration') || name.includes('connect')) {
      return 'integration';
    }
    if (name.includes('geo') || name.includes('location') || name.includes('map')) {
      return 'geo';
    }
    
    // Default color
    return 'default';
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
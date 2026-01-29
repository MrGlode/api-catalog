import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SearchService } from '../../../core/services/search.service';
import { SearchIndexState } from '../../../core/models/search.model';
import { GlobalSearchComponent } from '../../component/global-search/global-search.component';

/**
 * Page Header Component - Full navigation header
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, GlobalSearchComponent],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent implements OnInit, OnDestroy {
  isAuthenticated$!: Observable<boolean>;
  currentUser$!: Observable<string | null>;
  showUserMenu = false;
  showMobileMenu = false;

  // Search
  isSearchOpen = false;
  searchIndexState: SearchIndexState | null = null;
  private searchSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;

    // Subscribe to search index state
    this.searchSubscription = this.searchService.indexState$.subscribe(state => {
      this.searchIndexState = state;
      this.cdr.detectChanges();
    });

    // Start indexing
    this.searchService.startIndexing();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }

  /**
   * Toggle user dropdown menu
   */
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  /**
   * Close user menu
   */
  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout();
    this.showUserMenu = false;
    this.showMobileMenu = false;
    this.router.navigate(['/home']);
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(username: string | null): string {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  }

  // ========================================
  // SEARCH METHODS
  // ========================================

  /**
   * Open search modal
   */
  openSearch(): void {
    if (this.isSearchAvailable) {
      this.isSearchOpen = true;
    }
  }

  /**
   * Close search modal
   */
  closeSearch(): void {
    this.isSearchOpen = false;
  }

  /**
   * Check if search is available
   */
  get isSearchAvailable(): boolean {
    return this.searchIndexState?.status === 'ready';
  }

  /**
   * Check if indexing is in progress
   */
  get isSearchIndexing(): boolean {
    return this.searchIndexState?.status === 'indexing';
  }

  /**
   * Get indexing progress percentage
   */
  get indexingProgress(): number {
    return this.searchIndexState?.progress || 0;
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Page Header Component - Full navigation header
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent implements OnInit {
  isAuthenticated$!: Observable<boolean>;
  currentUser$!: Observable<string | null>;
  showUserMenu = false;
  showMobileMenu = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
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
}
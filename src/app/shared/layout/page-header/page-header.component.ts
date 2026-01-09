import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Page Header Component - Minimal top bar
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  
  isAuthenticated$!: Observable<boolean>;
  currentUser$!: Observable<string | null>;
  showUserMenu = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
  }

  /**
   * Toggle mobile sidebar
   */
  onToggleSidebar(): void {
    this.toggleSidebar.emit();
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

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PageHeaderComponent } from '../page-header/page-header.component';

/**
 * App Layout Component - Main layout with sidebar
 * GitBook-inspired design
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, PageHeaderComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss'
})
export class AppLayoutComponent {
  sidebarOpen = false;

  /**
   * Toggle sidebar (mobile)
   */
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  /**
   * Close sidebar (mobile)
   */
  closeSidebar(): void {
    this.sidebarOpen = false;
  }
}

import { Component } from '@angular/core';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';

/**
 * Root Application Component
 * Uses the GitBook-inspired layout
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppLayoutComponent],
  template: '<app-layout></app-layout>'
})
export class AppComponent {}
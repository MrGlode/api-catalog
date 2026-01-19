import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageHeaderComponent } from '../page-header/page-header.component';

/**
 * App Layout Component - Clean layout without sidebar
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, PageHeaderComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss'
})
export class AppLayoutComponent {}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
    isAuthenticated$!: Observable<boolean>;
    currentUser$!: Observable<string | null>;
    mobileMenuOpen = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.isAuthenticated$ = this.authService.isAuthenticated$;
        this.currentUser$ = this.authService.currentUser$;
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
        this.closeMobileMenu();
    }

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu(): void {
        this.mobileMenuOpen = false;
    }

    goHome(): void {
        this.router.navigate(['/catalog']);
        this.closeMobileMenu();
    }
}
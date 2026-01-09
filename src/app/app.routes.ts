import { Routes } from '@angular/router';
import { authGuard, guestGuard, configGuard } from './core/guards/guards-index';

export const routes: Routes = [
  // Redirect root to home
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },

  // Home page (landing page)
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component')
      .then(m => m.HomeComponent),
    title: 'Accueil - API Catalog'
  },

  // Catalog routes
  {
    path: 'catalog',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/catalog/pages/api-list/api-list.component')
          .then(m => m.ApiListComponent),
        title: 'Catalogue des API'
      },
      {
        path: ':id',
        loadComponent: () => import('./features/catalog/pages/api-detail/api-detail.component')
          .then(m => m.ApiDetailComponent),
        title: 'Détails de l\'API'
      }
    ]
  },

  // Login (guest only)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login.component')
      .then(m => m.LoginComponent),
    title: 'Connexion'
  },

  /*
  // Protected routes (requires auth)
  {
    path: 'applications',
    canActivate: [authGuard],
    loadComponent: () => import('./features/applications/applications.component')
      .then(m => m.ApplicationsComponent),
    title: 'Mes Applications'
  },
  {
    path: 'subscriptions',
    canActivate: [authGuard],
    loadComponent: () => import('./features/subscriptions/subscriptions.component')
      .then(m => m.SubscriptionsComponent),
    title: 'Mes Souscriptions'
  },

  // Documentation routes
  {
    path: 'docs',
    loadComponent: () => import('./features/docs/docs.component')
      .then(m => m.DocsComponent),
    title: 'Documentation'
  },
  {
    path: 'docs/:slug',
    loadComponent: () => import('./features/docs/docs.component')
      .then(m => m.DocsComponent),
    title: 'Documentation'
  },

  // Changelog
  {
    path: 'changelog',
    loadComponent: () => import('./features/changelog/changelog.component')
      .then(m => m.ChangelogComponent),
    title: 'Changelog'
  },
  */
 
  // Error pages
  {
    path: 'config-error',
    loadComponent: () => import('./features/errors/ConfigErrorComponent/config-error.component')
      .then(m => m.ConfigErrorComponent),
    title: 'Erreur de Configuration'
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./features/errors/ForbiddenComponent/forbidden.component')
      .then(m => m.ForbiddenComponent),
    title: 'Accès Interdit'
  },
  {
    path: 'not-found',
    loadComponent: () => import('./features/errors/NotFoundComponent/not-found.component')
      .then(m => m.NotFoundComponent),
    title: 'Page Non Trouvée'
  },

  // Catch-all redirect
  {
    path: '**',
    redirectTo: '/not-found'
  }
];
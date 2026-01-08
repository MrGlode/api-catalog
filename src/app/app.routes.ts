import { Routes } from '@angular/router';
import { authGuard, guestGuard, configGuard } from '../app/core/guards/guards-index';

export const routes: Routes = [
    {
        path: '', 
        redirectTo: '/catalog',
        pathMatch: 'full'
    },
    
    // Route de login accessible directement (hors de /auth pour plus de simplicité)
    {
        path: 'login',
        loadComponent: () => import('./features/login/login.component')
            .then(m => m.LoginComponent),
        title: 'Connexion'
    },
    
    /**
    {
        path: 'catalog',
        canActivate: [configGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./features/catalog/pages/api-list/api-list.component')
                    .then(m => m.ApiListComponent),
                title: 'Catalogue des API'
            },
            {
                path: ':id',
                loadComponent: () => import('./features/catalog/pages/api-detail/api-details.component')
                    .then(m => m.ApiDetailsComponent),
                title: 'Détails de l\'API'
            },
            {
                path: ':id/documentation',
                loadComponent: () => import('./features/catalog/pages/api-documentation/api-documentation.component')
                    .then(m => m.ApiDocumentationComponent),
                title: 'Documentation'
            },
            {
                path: ':id/sandbox',
                loadComponent: () => import('./features/catalog/pages/api-sandbox/api-sandbox.component')
                    .then(m => m.ApiSandboxComponent),
                title: 'Sandbox'
            }
        ]
    },
    {
        path: 'auth',
        canActivate: [guestGuard],
        children: [
            {
                path: 'login',
                loadComponent: () => import('./features/auth/pages/login/login.component')
                    .then(m => m.LoginComponent),
                title: 'Connexion'
            },
            {
                path: 'register',
                loadComponent: () => import('./features/auth/pages/register/register.component')
                    .then(m => m.RegisterComponent),
                title: 'Inscription'
            },
            {
                path: 'forgot-password',
                loadComponent: () => import('./features/auth/pages/forgot-password/forgot-password.component')
                    .then(m => m.ForgotPasswordComponent),
                title: 'Mot de passe oublié'
            }
        ]
    },
    {
        path: 'dashboard',
        canActivate: [authGuard, configGuard],
        loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent),
        title: 'Tableau de bord'
    },
    {
        path: 'applications',
        canActivate: [authGuard, configGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./features/applications/pages/application-list/application-list.component')
                    .then(m => m.ApplicationListComponent),
                title: 'Liste des applications'
            },
            {
                path: 'create',
                loadComponent: () => import('./features/applications/pages/application-create/application-create.component')
                    .then(m => m.ApplicationCreateComponent),
                title: 'Créer une application'
            },
            {
                path: ':id',
                loadComponent: () => import('./features/applications/pages/application-detail/application-detail.component')
                    .then(m => m.ApplicationDetailComponent),
                title: 'Détails de l\'application'
            },
            {
                path: ':id/edit',
                loadComponent: () => import('./features/applications/pages/application-edit/application-edit.component')
                    .then(m => m.ApplicationEditComponent),
                title: 'Modifier l\'application'
            },
            {
                path: ':id/keys',
                loadComponent: () => import('./features/applications/pages/application-keys/application-keys.component')
                    .then(m => m.ApplicationKeysComponent),
                title: 'Clés de l\'application'
            }
        ]
    },
    {
        path: 'subscriptions',
        canActivate: [authGuard, configGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./features/subscriptions/pages/subscription-list/subscription-list.component')
                    .then(m => m.SubscriptionListComponent),
                title: 'Mes Souscriptions'
            },
            {
                path: 'create',
                loadComponent: () => import('./features/subscriptions/pages/subscription-create/subscription-create.component')
                    .then(m => m.SubscriptionCreateComponent),
                title: 'Créer une Souscription'
            },
        ]
    },
    {
        path: 'profile',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./features/profile/pages/profile-view/profile-view.component')
                .then(m => m.ProfileViewComponent),
                title: 'Mon Profil'
            },
            {
                path: 'edit',
                loadComponent: () => import('./features/profile/pages/profile-edit/profile-edit.component')
                .then(m => m.ProfileEditComponent),
                title: 'Modifier le Profil'
            },
            {
                path: 'settings',
                loadComponent: () => import('./features/profile/pages/profile-settings/profile-settings.component')
                .then(m => m.ProfileSettingsComponent),
                title: 'Paramètres'
            }
        ]
    },
    */
    
    // Pages d'erreur avec les bons chemins
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
    {
        path: '**',
        redirectTo: '/not-found'
    }
];
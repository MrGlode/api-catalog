import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ConfigService } from '../services/config.service';

export const configGuard: CanActivateFn = (route, state) => {
    const configService = inject(ConfigService);
    const router = inject(Router);

    if (configService.hasOAuthCredentials()) {
        return true;
    }

    console.error('Les informations OAuth2 ne sont pas configurées. Veuillez configurer les identifiants OAuth2 dans le fichier de configuration.');

    return router.createUrlTree(['/config-error'], {
        queryParams: {
            error: 'missing_credentials',
            message: 'Configuration OAuth2 manquante'
        }
    });
};

export const configWarningGuard: CanActivateFn = (route, state) => {
    const configService = inject(ConfigService);

    if (!configService.hasOAuthCredentials()) {
        console.warn(
            '⚠️ ATTENTION: Les credentials OAuth2 ne sont pas configurés.\n' +
            'Certaines fonctionnalités peuvent ne pas fonctionner correctement.\n' +
            'Veuillez configurer clientId et clientSecret dans environment.ts'
        );
    }

    // Permettre l'accès malgré tout
    return true;
};
export const environment = {
  production: false,
  wso2: {
    // URL de base de l'API Manager WSO2
    baseUrl: 'https://localhost:9443',
    
    // URL de l'API Devportal
    devportalApiUrl: 'https://localhost:9443/api/am/devportal/v3',
    
    // URL du token OAuth2
    tokenUrl: 'https://localhost:9443/oauth2/token',
    
    // URL d'enregistrement DCR (Dynamic Client Registration)
    dcrUrl: 'https://localhost:9443/client-registration/v0.17/register',
    
    // Tenant par défaut (laisser vide pour super tenant)
    tenant: '',
    
    // Configuration OAuth2
    oauth2: {
      clientId: '', // À remplir après l'enregistrement DCR
      clientSecret: '', // À remplir après l'enregistrement DCR
      
      // Scopes nécessaires pour le devportal
      scopes: [
        'apim:subscribe',        // Souscrire aux APIs
        'apim:api_key',          // Générer des clés API
        'apim:app_manage',       // Gérer les applications
        'apim:sub_manage',       // Gérer les souscriptions
        'apim:store_settings',   // Paramètres du devportal
      ].join(' ')
    }
  },
  
  // Configuration de l'application
  app: {
    name: 'WSO2 API Catalog',
    version: '1.0.0',
    itemsPerPage: 25,
    
    // Délai avant expiration du token (en secondes)
    // Le token JWT a généralement une durée de vie de 3600s (1h)
    tokenExpirationBuffer: 300 // Renouveler 5 min avant expiration
  }
};
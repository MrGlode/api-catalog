export const environment = {
  production: true,
  wso2: {
    // URL de base de l'API Manager WSO2 (À MODIFIER pour votre environnement de production)
    baseUrl: 'https://api-manager.votredomaine.com',
    
    // URL de l'API Devportal
    devportalApiUrl: 'https://api-manager.votredomaine.com/api/am/devportal/v3',
    
    // URL du token OAuth2
    tokenUrl: 'https://api-manager.votredomaine.com/oauth2/token',
    
    // URL d'enregistrement DCR (Dynamic Client Registration)
    dcrUrl: 'https://api-manager.votredomaine.com/client-registration/v0.17/register',
    
    // Tenant par défaut (laisser vide pour super tenant)
    tenant: '',
    
    // Configuration OAuth2
    oauth2: {
      clientId: '', // À configurer via variables d'environnement ou secrets management
      clientSecret: '', // À configurer via variables d'environnement ou secrets management
      
      // Scopes nécessaires pour le devportal
      scopes: [
        'apim:subscribe',
        'apim:api_key',
        'apim:app_manage',
        'apim:sub_manage',
        'apim:store_settings',
      ].join(' ')
    }
  },
  
  // Configuration de l'application
  app: {
    name: 'WSO2 API Catalog',
    version: '1.0.0',
    itemsPerPage: 25,
    tokenExpirationBuffer: 300
  }
};
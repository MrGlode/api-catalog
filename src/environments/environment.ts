/**
 * Environment configuration for WSO2 API Manager integration
 * Uses proxy for local development (avoid CORS/SSL issues)
 */
export const environment = {
  production: false,
  
  // WSO2 API Manager Configuration
  wso2: {
    // Base URLs - Empty for proxy mode, full URL for direct mode
    baseUrl: '', // Use proxy in development
    // baseUrl: 'https://localhost:9443', // Direct mode (requires CORS config)
    
    devportalApi: '/api/am/devportal/v3',
    
    // OAuth2 Configuration
    oauth: {
      tokenEndpoint: '/oauth2/token',
      dcrEndpoint: '/client-registration/v0.17/register',
      authorizeEndpoint: '/oauth2/authorize',
      revokeEndpoint: '/oauth2/revoke',
      userinfoEndpoint: '/oauth2/userinfo',
    },
    
    // DCR Application Settings
    dcr: {
      clientName: 'wso2_api_catalog_app',
      grantTypes: 'password refresh_token client_credentials',
      callbackUrl: 'http://localhost:4200/callback',
    },
    
    // API Scopes
    scopes: {
      subscribe: 'apim:subscribe',
      apiKey: 'apim:api_key',
      appManage: 'apim:app_manage',
      subManage: 'apim:sub_manage',
      storeSettings: 'apim:store_settings',
    },
    
    // Default pagination
    pagination: {
      defaultLimit: 25,
      maxLimit: 100,
    },
  },
  
  // Application Settings
  app: {
    name: 'API Catalog',
    version: '1.0.0',
  },
};

/**
 * Helper to get full API URL
 */
export function getApiUrl(path: string): string {
  return `${environment.wso2.baseUrl}${environment.wso2.devportalApi}${path}`;
}

/**
 * Helper to get OAuth URL
 */
export function getOAuthUrl(endpoint: keyof typeof environment.wso2.oauth): string {
  return `${environment.wso2.baseUrl}${environment.wso2.oauth[endpoint]}`;
}
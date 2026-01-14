/**
 * Environment configuration for WSO2 API Manager integration
 * Structure compatible with ConfigService
 */
export const environment = {
  production: false,
  
  // WSO2 API Manager Configuration
  wso2: {
    // Base URL
    baseUrl: '', // Empty for proxy mode in development
    // baseUrl: 'https://localhost:9443', // Direct mode
    
    // API URLs
    devportalApi: '/api/am/devportal/v3',
    devportalApiUrl: '/api/am/devportal/v3', // Alias for config.service.ts
    
    // OAuth2 endpoints (flat structure for config.service.ts)
    tokenUrl: '/oauth2/token',
    dcrUrl: '/client-registration/v0.17/register',
    
    // OAuth2 Configuration (nested structure)
    oauth: {
      tokenEndpoint: '/oauth2/token',
      dcrEndpoint: '/client-registration/v0.17/register',
      authorizeEndpoint: '/oauth2/authorize',
      revokeEndpoint: '/oauth2/revoke',
      userinfoEndpoint: '/oauth2/userinfo',
    },
    
    // OAuth2 client configuration (for config.service.ts)
    oauth2: {
      clientId: '', // Will be set after DCR registration
      clientSecret: '', // Will be set after DCR registration
      scopes: 'openid apim:subscribe apim:api_key apim:app_manage apim:sub_manage',
    },
    
    // DCR Application Settings
    dcr: {
      clientName: 'wso2_api_catalog_app',
      grantTypes: 'password refresh_token client_credentials',
      callbackUrl: 'http://localhost:4200/callback',
    },
    
    // Tenant
    tenant: 'carbon.super',
    
    // API Scopes
    scopes: {
      openid: 'openid',
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
    itemsPerPage: 25,
    tokenExpirationBuffer: 300, // 5 minutes in seconds
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
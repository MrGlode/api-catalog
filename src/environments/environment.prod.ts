/**
 * Production Environment configuration
 * 
 * SECURITY: No client secrets in this file!
 * OAuth2 authentication is handled by the BFF server.
 */
export const environment = {
  production: true,
  
  // WSO2 API Manager Configuration
  wso2: {
    // Base URL - will be proxied through BFF/reverse proxy
    baseUrl: '',
    
    // API URLs
    devportalApi: '/api/am/devportal/v3',
    devportalApiUrl: '/api/am/devportal/v3',
    
    // Tenant
    tenant: 'carbon.super',
    
    // Default pagination
    pagination: {
      defaultLimit: 25,
      maxLimit: 100,
    },
  },

  // BFF Server Configuration
  bff: {
    baseUrl: '/api',
    
    auth: {
      login: '/api/auth/login',
      refresh: '/api/auth/refresh',
      logout: '/api/auth/logout',
      userinfo: '/api/auth/userinfo',
      status: '/api/auth/status',
    },
    
    registration: {
      register: '/api/register',
      checkUsername: '/api/check-username',
    },
  },
  
  // Application Settings
  app: {
    name: 'API Catalog',
    version: '1.0.0',
    itemsPerPage: 25,
    tokenExpirationBuffer: 300,
  },
};

/**
 * Helper to get full Devportal API URL
 */
export function getApiUrl(path: string): string {
  return `${environment.wso2.baseUrl}${environment.wso2.devportalApi}${path}`;
}
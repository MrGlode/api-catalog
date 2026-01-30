/**
 * BFF Configuration
 * 
 * Centralizes all configuration with environment variable support.
 * Client secrets are loaded here and NEVER sent to the frontend.
 */

// Load .env file in development
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 3001,
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  },

  // WSO2 API Manager configuration
  wso2: {
    baseUrl: process.env.WSO2_BASE_URL || 'https://localhost:9443',
    tenant: process.env.WSO2_TENANT || 'carbon.super',
    
    // OAuth2 endpoints
    oauth: {
      tokenEndpoint: '/oauth2/token',
      revokeEndpoint: '/oauth2/revoke',
      userinfoEndpoint: '/oauth2/userinfo',
      authorizeEndpoint: '/oauth2/authorize',
    },
    
    // DCR endpoint
    dcrEndpoint: '/client-registration/v0.17/register',
    
    // Service Provider for registration
    sp: process.env.WSO2_SP || 'apim_devportal',
  },

  // OAuth2 client credentials (SERVER-SIDE ONLY - NEVER EXPOSE TO FRONTEND)
  oauth: {
    clientId: process.env.WSO2_CLIENT_ID || '',
    clientSecret: process.env.WSO2_CLIENT_SECRET || '',
    scopes: process.env.WSO2_SCOPES || 'openid apim:subscribe apim:api_key apim:app_manage apim:sub_manage',
  },

  // Cookie configuration for refresh tokens
  cookies: {
    refreshToken: {
      name: 'wso2_refresh_token',
      options: {
        httpOnly: true,                    // Not accessible via JavaScript
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',                // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 days
        path: '/api/auth',                 // Only sent to auth endpoints
      },
    },
  },

  // Token configuration
  tokens: {
    accessTokenBuffer: 300, // 5 minutes buffer before expiry
  },
};

/**
 * Validate required configuration
 */
function validateConfig() {
  const errors = [];

  if (!config.oauth.clientId) {
    errors.push('WSO2_CLIENT_ID is required');
  }

  if (!config.oauth.clientSecret) {
    errors.push('WSO2_CLIENT_SECRET is required');
  }

  if (errors.length > 0) {
    console.error('');
    console.error('❌ Configuration errors:');
    errors.forEach(err => console.error(`   - ${err}`));
    console.error('');
    console.error('💡 Create a .env file with:');
    console.error('   WSO2_CLIENT_ID=your_client_id');
    console.error('   WSO2_CLIENT_SECRET=your_client_secret');
    console.error('   WSO2_BASE_URL=https://your-wso2-server:9443');
    console.error('');
    
    if (config.server.env === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️  Running in development mode without OAuth credentials');
      console.warn('   Authentication endpoints will not work');
      console.warn('');
    }
  }
}

/**
 * Get full WSO2 URL for an endpoint
 */
function getWso2Url(endpoint) {
  return `${config.wso2.baseUrl}${endpoint}`;
}

/**
 * Get OAuth endpoint URL
 */
function getOAuthUrl(endpoint) {
  return getWso2Url(config.wso2.oauth[endpoint]);
}

// Validate on load
validateConfig();

// Debug log (only in development)
if (config.server.env !== 'production') {
  console.log('');
  console.log('📋 Configuration loaded:');
  console.log(`   WSO2_BASE_URL: ${config.wso2.baseUrl}`);
  console.log(`   WSO2_CLIENT_ID: ${config.oauth.clientId ? config.oauth.clientId.substring(0, 8) + '...' : '(not set)'}`);
  console.log(`   WSO2_CLIENT_SECRET: ${config.oauth.clientSecret ? '***' + config.oauth.clientSecret.slice(-4) : '(not set)'}`);
  console.log(`   CORS_ORIGIN: ${config.server.corsOrigin}`);
  console.log('');
}

module.exports = {
  config,
  getWso2Url,
  getOAuthUrl,
};
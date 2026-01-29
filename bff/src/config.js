const config = {
    server: {
        port: parseInt(process.env.PORT, 10) || 3001,
        env: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    },

    wso2: {
        baseUrl: process.env.WSO2_BASE_URL || 'https://localhost:9443',
        tenant: process.env.WSO2_TENANT || 'carbon.super',
        oauth: {
            tokenEndpoint: '/oauth2/token',
            revokeEndpoint: '/oauth2/revoke',
            userinfoEndpoint: '/oauth2/userinfo',
            authorizeEndpoint: '/oauth2/authorize',
        },
        dcrEndpoint: '/client-registration/v0.17/register',
        sp: process.env.WSO2_SP || 'apim_devportal'
    },

    oauth: {
        clientId: process.env.WSO2_CLIENT_ID || '',
        clientSecret: process.env.WSO2_CLIENT_SECRET || '',
        scopes: process.env.WSO2_SCOPES || 'openid apim:subscribe apim:api_key apim:app_manage apim:sub_manage',
    },

    cookies: {
        refreshToken: {
            name: 'wso2_refresh_token',
            options: {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000, // 1 jour
                path: '/api/auth'
            }
        }
    },

    tokens: {
        accessTokenBuffer: 300
    }
};

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

function getWso2Url(endpoint) {
  return `${config.wso2.baseUrl}${endpoint}`;
}

function getOAuthUrl(endpoint) {
  return getWso2Url(config.wso2.oauth[endpoint]);
}

validateConfig();

module.exports = {
  config,
  getWso2Url,
  getOAuthUrl,
};
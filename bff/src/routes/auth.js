/**
 * Authentication Routes
 * 
 * Handles OAuth2 authentication flow securely.
 * Client secrets stay server-side - frontend only receives access tokens.
 * 
 * Endpoints:
 *   POST /api/auth/login     - Login with username/password
 *   POST /api/auth/refresh   - Refresh access token
 *   POST /api/auth/logout    - Logout (revoke tokens)
 *   GET  /api/auth/userinfo  - Get current user info
 */

const express = require('express');
const axios = require('axios');
const { config, getOAuthUrl, getWso2Url } = require('../config');

const router = express.Router();

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Create Basic Auth header from client credentials
 */
function getBasicAuthHeader() {
  const credentials = `${config.oauth.clientId}:${config.oauth.clientSecret}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

/**
 * Set refresh token as httpOnly cookie
 */
function setRefreshTokenCookie(res, refreshToken) {
  if (refreshToken) {
    res.cookie(
      config.cookies.refreshToken.name,
      refreshToken,
      config.cookies.refreshToken.options
    );
  }
}

/**
 * Clear refresh token cookie
 */
function clearRefreshTokenCookie(res) {
  res.clearCookie(config.cookies.refreshToken.name, {
    path: config.cookies.refreshToken.options.path,
  });
}

/**
 * Extract access token from Authorization header
 */
function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// =============================================================================
// POST /api/auth/login
// =============================================================================

/**
 * Login with username and password
 * 
 * Request body:
 *   { username: string, password: string }
 * 
 * Response:
 *   { 
 *     access_token: string,
 *     token_type: string,
 *     expires_in: number,
 *     scope: string
 *   }
 * 
 * Note: refresh_token is stored in httpOnly cookie, not returned in response
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Username and password are required',
    });
  }

  // Check OAuth credentials are configured
  if (!config.oauth.clientId || !config.oauth.clientSecret) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'OAuth credentials not configured on server',
    });
  }

  try {
    console.log(`[AUTH] Login attempt for user: ${username}`);

    // Request token from WSO2
    const tokenUrl = getOAuthUrl('tokenEndpoint');
    
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'password',
        username,
        password,
        scope: config.oauth.scopes,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          //'Authorization': getBasicAuthHeader(),
        },
      }
    );

    const tokenData = response.data;
    console.log(`[AUTH] Login successful for user: ${username}`);

    // Store refresh token in httpOnly cookie (secure)
    setRefreshTokenCookie(res, tokenData.refresh_token);

    // Return access token to frontend (refresh token is NOT included)
    return res.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
    });

  } catch (error) {
    console.error('[AUTH] Login failed:', error.response?.data || error.message);

    if (error.response) {
      const status = error.response.status;
      
      if (status === 400 || status === 401) {
        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'Invalid username or password',
        });
      }
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'WSO2 server is not reachable',
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
});

// =============================================================================
// POST /api/auth/refresh
// =============================================================================

/**
 * Refresh access token using refresh token from cookie
 * 
 * Response:
 *   { 
 *     access_token: string,
 *     token_type: string,
 *     expires_in: number,
 *     scope: string
 *   }
 */
router.post('/refresh', async (req, res) => {
  // Get refresh token from httpOnly cookie
  const refreshToken = req.cookies[config.cookies.refreshToken.name];

  if (!refreshToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No refresh token available',
    });
  }

  // Check OAuth credentials are configured
  if (!config.oauth.clientId || !config.oauth.clientSecret) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'OAuth credentials not configured on server',
    });
  }

  try {
    console.log('[AUTH] Refreshing token...');

    const tokenUrl = getOAuthUrl('tokenEndpoint');
    
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': getBasicAuthHeader(),
        },
      }
    );

    const tokenData = response.data;
    console.log('[AUTH] Token refreshed successfully');

    // Update refresh token cookie if a new one was issued
    if (tokenData.refresh_token) {
      setRefreshTokenCookie(res, tokenData.refresh_token);
    }

    // Return new access token
    return res.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
    });

  } catch (error) {
    console.error('[AUTH] Token refresh failed:', error.response?.data || error.message);

    // Clear invalid refresh token
    clearRefreshTokenCookie(res);

    if (error.response?.status === 400 || error.response?.status === 401) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token expired or invalid',
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Token refresh failed',
    });
  }
});

// =============================================================================
// POST /api/auth/logout
// =============================================================================

/**
 * Logout - revoke tokens and clear cookies
 * 
 * Optionally accepts access_token in Authorization header to revoke it
 */
router.post('/logout', async (req, res) => {
  const accessToken = extractBearerToken(req);
  const refreshToken = req.cookies[config.cookies.refreshToken.name];

  console.log('[AUTH] Logout requested');

  // Clear refresh token cookie immediately
  clearRefreshTokenCookie(res);

  // Try to revoke tokens at WSO2 (best effort)
  const revokePromises = [];

  if (config.oauth.clientId && config.oauth.clientSecret) {
    const revokeUrl = getOAuthUrl('revokeEndpoint');
    
    if (accessToken) {
      revokePromises.push(
        axios.post(
          revokeUrl,
          new URLSearchParams({ token: accessToken }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': getBasicAuthHeader(),
            },
          }
        ).catch(err => {
          console.warn('[AUTH] Failed to revoke access token:', err.message);
        })
      );
    }

    if (refreshToken) {
      revokePromises.push(
        axios.post(
          revokeUrl,
          new URLSearchParams({ token: refreshToken }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': getBasicAuthHeader(),
            },
          }
        ).catch(err => {
          console.warn('[AUTH] Failed to revoke refresh token:', err.message);
        })
      );
    }
  }

  // Wait for revocation attempts (don't fail if they error)
  await Promise.allSettled(revokePromises);

  console.log('[AUTH] Logout completed');

  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// =============================================================================
// GET /api/auth/userinfo
// =============================================================================

/**
 * Get user info from WSO2
 * 
 * Requires: Authorization: Bearer {access_token}
 * 
 * Response:
 *   { sub, name, given_name, family_name, preferred_username, email, ... }
 */
router.get('/userinfo', async (req, res) => {
  const accessToken = extractBearerToken(req);

  if (!accessToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token required',
    });
  }

  try {
    const userinfoUrl = getOAuthUrl('userinfoEndpoint');
    
    const response = await axios.get(userinfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return res.json(response.data);

  } catch (error) {
    console.error('[AUTH] Userinfo failed:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token expired or invalid',
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user info',
    });
  }
});

// =============================================================================
// GET /api/auth/status
// =============================================================================

/**
 * Check authentication status
 * 
 * Returns whether the user has a valid refresh token cookie
 */
router.get('/status', (req, res) => {
  const hasRefreshToken = !!req.cookies[config.cookies.refreshToken.name];
  
  return res.json({
    authenticated: hasRefreshToken,
  });
});

module.exports = router;
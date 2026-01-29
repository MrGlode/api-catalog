/**
 * Registration Routes
 * 
 * Handles user self-registration via WSO2 Identity Server.
 * Migrated from registration-proxy/server.js
 * 
 * Endpoints:
 *   POST /api/register        - Register new user
 *   POST /api/check-username  - Check username availability
 */

const express = require('express');
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const { config, getWso2Url } = require('../config');

const router = express.Router();

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Create axios client with cookie jar support
 * Required for WSO2's multi-step registration flow
 */
function createCookieClient() {
  const jar = new CookieJar();
  return wrapper(axios.create({ jar }));
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password policy
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character (@$!%*?&)
 */
function isValidPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
}

// =============================================================================
// POST /api/register
// =============================================================================

/**
 * Register a new user
 * 
 * Request body:
 *   {
 *     username: string (required),
 *     password: string (required),
 *     email: string (required),
 *     firstName: string (required),
 *     lastName: string (required),
 *     organization?: string,
 *     phone?: string,
 *     country?: string
 *   }
 * 
 * Response:
 *   { success: true, message: string, username: string }
 */
router.post('/register', async (req, res) => {
  const { 
    username, 
    password, 
    email, 
    firstName, 
    lastName,
    organization,
    phone,
    country
  } = req.body;

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  // Required fields
  if (!username || !password || !email || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      details: 'username, password, email, firstName, lastName are required',
    });
  }

  // Username validation
  if (username.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Invalid username',
      details: 'Username must be at least 3 characters',
    });
  }

  // Email validation
  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email',
      details: 'Please provide a valid email address',
    });
  }

  // Password validation
  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid password',
      details: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 special character (@$!%*?&)',
    });
  }

  // ==========================================================================
  // WSO2 REGISTRATION FLOW
  // ==========================================================================

  try {
    const client = createCookieClient();
    const baseUrl = config.wso2.baseUrl;
    const tenant = config.wso2.tenant;
    const sp = config.wso2.sp;

    console.log(`[REGISTER] Starting registration for user: ${username}`);

    // ------------------------------------------------------------------------
    // Step 1: Initialize session (GET register.do)
    // ------------------------------------------------------------------------
    console.log('[REGISTER] Step 1: Initializing session...');
    
    const step1Url = `${baseUrl}/accountrecoveryendpoint/register.do?sp=${sp}&tenantDomain=${tenant}`;
    const step1Response = await client.get(step1Url);
    
    if (step1Response.status !== 200) {
      console.error('[REGISTER] Step 1 failed:', step1Response.status);
      return res.status(502).json({
        success: false,
        error: 'Registration service unavailable',
      });
    }
    console.log('[REGISTER] Step 1: OK');

    // ------------------------------------------------------------------------
    // Step 2: Submit username (POST signup.do)
    // ------------------------------------------------------------------------
    console.log('[REGISTER] Step 2: Submitting username...');
    
    const step2Data = new URLSearchParams({
      username,
      tenantDomain: tenant,
      sp: sp,
      isSaaSApp: 'true',
    });

    const step2Response = await client.post(
      `${baseUrl}/accountrecoveryendpoint/signup.do`,
      step2Data.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // Check if username already exists
    if (step2Response.data?.includes('already exists')) {
      console.log(`[REGISTER] Username ${username} already exists`);
      return res.status(409).json({
        success: false,
        error: 'Username already exists',
      });
    }
    console.log('[REGISTER] Step 2: OK');

    // ------------------------------------------------------------------------
    // Step 3: Create account (POST processregistration.do)
    // ------------------------------------------------------------------------
    console.log('[REGISTER] Step 3: Creating account...');
    
    const step3Data = new URLSearchParams({
      username,
      password,
      password2: password,
      'http://wso2.org/claims/givenname': firstName,
      'http://wso2.org/claims/lastname': lastName,
      'http://wso2.org/claims/emailaddress': email,
      'http://wso2.org/claims/organization': organization || '',
      'http://wso2.org/claims/telephone': phone || '',
      'http://wso2.org/claims/country': country || '',
      isSelfRegistrationWithVerification: 'true',
      tenantDomain: tenant,
      isSaaSApp: 'true',
    });

    const step3Response = await client.post(
      `${baseUrl}/accountrecoveryendpoint/processregistration.do`,
      step3Data.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const html = step3Response.data;

    // ------------------------------------------------------------------------
    // Check registration result
    // ------------------------------------------------------------------------
    
    // Success patterns
    if (html.includes('Inscription terminée avec succès') || 
        html.includes('Registration successful') ||
        html.includes('successfully registered')) {
      console.log(`[REGISTER] Success: ${username} registered`);
      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        username,
      });
    }

    // Error patterns
    if (html.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'Username already exists',
      });
    }

    if (html.includes('password') && html.includes('policy')) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet policy requirements',
      });
    }

    // Unknown response
    console.error('[REGISTER] Unexpected response:', html.substring(0, 500));
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
    });

  } catch (error) {
    console.error('[REGISTER] Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'WSO2 server unavailable',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
});

// =============================================================================
// POST /api/check-username
// =============================================================================

/**
 * Check if username is available
 * 
 * Request body:
 *   { username: string }
 * 
 * Response:
 *   { available: boolean, username: string }
 */
router.post('/check-username', async (req, res) => {
  const { username } = req.body;

  if (!username || username.length < 3) {
    return res.status(400).json({
      available: false,
      error: 'Username must be at least 3 characters',
    });
  }

  try {
    const client = createCookieClient();
    const baseUrl = config.wso2.baseUrl;
    const tenant = config.wso2.tenant;
    const sp = config.wso2.sp;

    // Initialize session
    await client.get(
      `${baseUrl}/accountrecoveryendpoint/register.do?sp=${sp}&tenantDomain=${tenant}`
    );

    // Check username
    const response = await client.post(
      `${baseUrl}/accountrecoveryendpoint/signup.do`,
      new URLSearchParams({
        username,
        tenantDomain: tenant,
        sp: sp,
        isSaaSApp: 'true',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const available = !response.data.includes('already exists');
    
    return res.json({
      available,
      username,
    });

  } catch (error) {
    console.error('[CHECK-USERNAME] Error:', error.message);
    return res.status(500).json({
      available: false,
      error: 'Failed to check username',
    });
  }
});

module.exports = router;
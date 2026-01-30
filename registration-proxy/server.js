/**
 * WSO2 Registration Proxy Service
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

// Désactiver la vérification SSL en dev
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration WSO2
const WSO2_BASE_URL = process.env.WSO2_BASE_URL || 'https://cp-am.recette.verspieren.com:9443';
const WSO2_TENANT = process.env.WSO2_TENANT || 'carbon.super';
const WSO2_SP = process.env.WSO2_SP || 'apim_devportal';

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Créer un client axios avec cookie jar
 */
function createClient() {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar }));
  return client;
}

/**
 * POST /api/register
 */
app.post('/api/register', async (req, res) => {
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

  // Validation
  if (!username || !password || !email || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: 'Champs requis manquants',
      details: 'username, password, email, firstName, lastName sont obligatoires'
    });
  }

  // Validation email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Format email invalide'
    });
  }

  // Validation password
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
    return res.status(400).json({
      success: false,
      error: 'Le mot de passe ne respecte pas les exigences',
      details: 'Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial (@$!%*?&)'
    });
  }

  try {
    const client = createClient();

    console.log(`[REGISTER] Starting registration for user: ${username}`);

    // Étape 1: GET register.do
    console.log('[REGISTER] Step 1: Getting session...');
    const step1Url = `${WSO2_BASE_URL}/accountrecoveryendpoint/register.do?sp=${WSO2_SP}&tenantDomain=${WSO2_TENANT}`;
    
    const step1Response = await client.get(step1Url);
    
    if (step1Response.status !== 200) {
      console.error('[REGISTER] Step 1 failed:', step1Response.status);
      return res.status(502).json({
        success: false,
        error: 'Impossible d\'initialiser la session'
      });
    }
    console.log('[REGISTER] Step 1: OK');

    // Étape 2: POST signup.do
    console.log('[REGISTER] Step 2: Submitting username...');
    const step2Data = new URLSearchParams({
      username,
      tenantDomain: WSO2_TENANT,
      sp: WSO2_SP,
      isSaaSApp: 'true'
    });

    const step2Response = await client.post(
      `${WSO2_BASE_URL}/accountrecoveryendpoint/signup.do`,
      step2Data.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (step2Response.data?.includes('already exists')) {
      console.log(`[REGISTER] Username ${username} already exists`);
      return res.status(409).json({
        success: false,
        error: 'Ce nom d\'utilisateur existe déjà'
      });
    }
    console.log('[REGISTER] Step 2: OK');

    // Étape 3: POST processregistration.do
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
      tenantDomain: WSO2_TENANT,
      isSaaSApp: 'true'
    });

    const step3Response = await client.post(
      `${WSO2_BASE_URL}/accountrecoveryendpoint/processregistration.do`,
      step3Data.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const html = step3Response.data;

    // Vérifier succès
    if (html.includes('Inscription terminée avec succès') || 
        html.includes('Registration successful') ||
        html.includes('successfully registered')) {
      console.log(`[REGISTER] Success: ${username} registered`);
      return res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        username
      });
    }

    // Erreurs
    if (html.includes('already exists')) {
      return res.status(409).json({ success: false, error: 'Utilisateur existe déjà' });
    }
    if (html.includes('password') && html.includes('policy')) {
      return res.status(400).json({ success: false, error: 'Mot de passe non conforme' });
    }

    console.error('[REGISTER] Unexpected response:', html.substring(0, 300));
    return res.status(500).json({ success: false, error: 'Échec inscription' });

  } catch (error) {
    console.error('[REGISTER] Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ success: false, error: 'WSO2 indisponible' });
    }

    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/check-username
 */
app.post('/api/check-username', async (req, res) => {
  const { username } = req.body;

  if (!username || username.length < 3) {
    return res.status(400).json({ available: false, error: 'Username requis (min 3 car.)' });
  }

  try {
    const client = createClient();

    await client.get(`${WSO2_BASE_URL}/accountrecoveryendpoint/register.do?sp=${WSO2_SP}&tenantDomain=${WSO2_TENANT}`);

    const response = await client.post(
      `${WSO2_BASE_URL}/accountrecoveryendpoint/signup.do`,
      new URLSearchParams({ username, tenantDomain: WSO2_TENANT, sp: WSO2_SP, isSaaSApp: 'true' }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const available = !response.data.includes('already exists');
    return res.json({ available, username });

  } catch (error) {
    console.error('[CHECK-USERNAME] Error:', error.message);
    return res.status(500).json({ available: false, error: 'Erreur vérification' });
  }
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 WSO2 Registration Proxy on port ${PORT}`);
  console.log(`   WSO2: ${WSO2_BASE_URL}`);
});
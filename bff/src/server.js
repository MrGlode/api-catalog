const express = require('express');
const cors = require('cors');
const helmet = require('helmet')
const cookieParser = require('cookie-parser');

if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = express();
const PORT = process.env.PORT || 3001;

const authRoutes = require('./routes/auth');
const registerRoutes = require('./routes/register');

app.use(helmet({
    contentSecurityPolicy: false,
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'api-catalog-bff',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
    });
});

app.use('/api/auth', authRoutes);
app.use('/api', registerRoutes);

app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
});

app.use((err, req, res, next) => {
    console.error('[ERROR]', err);

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 WSO2 BFF Server started');
  console.log(`   Port: ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   WSO2 Base URL: ${process.env.WSO2_BASE_URL || 'https://localhost:9443'}`);
  console.log(`   CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:4200'}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('   GET  /health              - Health check');
  console.log('   POST /api/auth/login      - User login');
  console.log('   POST /api/auth/refresh    - Refresh access token');
  console.log('   POST /api/auth/logout     - Logout (revoke token)');
  console.log('   GET  /api/auth/userinfo   - Get user info');
  console.log('   POST /api/register        - User registration');
  console.log('   POST /api/check-username  - Check username availability');
  console.log('');
});

module.exports = app;
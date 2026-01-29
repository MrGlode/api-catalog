# WSO2 BFF Server

Backend-For-Frontend (BFF) server for secure WSO2 API Manager authentication.

## Why BFF?

**Security Issue**: Storing OAuth2 client secrets in frontend code is a critical security vulnerability. Anyone can extract secrets from browser DevTools, bundled JavaScript, or network requests.

**Solution**: The BFF server keeps client secrets server-side. The frontend only receives access tokens, while refresh tokens are stored in httpOnly cookies that JavaScript cannot access.

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Angular App    │◄────►│   BFF Server    │◄────►│  WSO2 API Mgr   │
│  (Frontend)     │      │   (Node.js)     │      │                 │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │
        │                        │
   Access Token            Client Secret
   (localStorage)          (env variable)
                                 │
                           Refresh Token
                           (httpOnly cookie)
```

## Security Features

| Feature | Before (Insecure) | After (BFF) |
|---------|-------------------|-------------|
| Client Secret | In JS bundle | Server-side only |
| Refresh Token | localStorage | httpOnly cookie |
| Token Refresh | Direct to WSO2 | Via BFF |
| XSS Risk | High | Mitigated |

## Quick Start

### 1. Install dependencies

```bash
cd bff-server
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
WSO2_BASE_URL=https://your-wso2-server:9443
WSO2_CLIENT_ID=your_client_id
WSO2_CLIENT_SECRET=your_client_secret
CORS_ORIGIN=http://localhost:4200
```

### 3. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with username/password |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (revoke tokens) |
| GET | `/api/auth/userinfo` | Get current user info |
| GET | `/api/auth/status` | Check auth status |

### Registration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new user |
| POST | `/api/check-username` | Check username availability |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## Angular Integration

### 1. Update AuthService

Replace the existing `auth.service.ts` with the new BFF-compatible version that:
- Calls `/api/auth/*` endpoints instead of direct WSO2 URLs
- Uses `withCredentials: true` for cookie handling
- Removes all client secret references

### 2. Update environment files

Remove OAuth2 credentials from `environment.ts`:
```typescript
// BEFORE (insecure)
oauth2: {
  clientId: 'xxx',
  clientSecret: 'yyy', // EXPOSED!
}

// AFTER (secure)
bff: {
  auth: {
    login: '/api/auth/login',
    // ...
  }
}
```

### 3. Update proxy configuration

Add BFF routes to `proxy.conf.json`:
```json
{
  "/api/auth": {
    "target": "http://localhost:3001",
    "secure": false
  }
}
```

### 4. Remove deprecated files

- Delete `public/config.json` (contained secrets)
- Delete `config-loader.service.ts` (no longer needed)

## Docker Deployment

### Build image

```bash
docker build -t wso2-bff-server .
```

### Run container

```bash
docker run -d \
  -p 3001:3001 \
  -e WSO2_BASE_URL=https://wso2:9443 \
  -e WSO2_CLIENT_ID=your_client_id \
  -e WSO2_CLIENT_SECRET=your_client_secret \
  -e CORS_ORIGIN=https://your-app.com \
  -e NODE_ENV=production \
  wso2-bff-server
```

### Docker Compose

```yaml
services:
  bff:
    build: ./bff-server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - WSO2_BASE_URL=https://wso2:9443
      - WSO2_CLIENT_ID=${WSO2_CLIENT_ID}
      - WSO2_CLIENT_SECRET=${WSO2_CLIENT_SECRET}
      - CORS_ORIGIN=https://your-app.com
    depends_on:
      - wso2
```

## Migration Checklist

- [ ] Deploy BFF server
- [ ] Configure WSO2 credentials in BFF `.env`
- [ ] Update Angular `AuthService`
- [ ] Update Angular `environment.ts` (remove secrets)
- [ ] Update Angular `proxy.conf.json`
- [ ] Update `ConfigService` (remove secret getters)
- [ ] Delete `public/config.json`
- [ ] Delete `ConfigLoaderService`
- [ ] Test login/logout flow
- [ ] Test token refresh
- [ ] Update production deployment

## Troubleshooting

### CORS errors
Ensure `CORS_ORIGIN` matches your Angular app's origin exactly.

### Cookies not sent
Check that:
1. `withCredentials: true` is set in Angular HTTP calls
2. `credentials: true` is set in BFF CORS config
3. `sameSite` cookie setting is appropriate

### Token refresh fails
The refresh token cookie may have expired (1 days default). User needs to login again.

### WSO2 connection refused
Check `WSO2_BASE_URL` and ensure the WSO2 server is accessible from the BFF server.
# Deployment Plan: Backend & Frontend

## User Story
Deploy the Whist game backend (FastAPI) and frontend (Angular) to production with proper environment configuration supporting local, staging, and production environments.

## Current State Analysis

### Backend Configuration Issues
- ✅ Environment variable support exists (`ENVIRONMENT`, `FRONTEND_URL`, `CORS_ORIGINS`)
- ❌ `FRONTEND_URL` defaults to `http://localhost:4200` (hardcoded)
- ❌ `CORS_ORIGINS` defaults to localhost (hardcoded)
- ✅ Email service uses `settings.frontend_url` for invitation links (good)
- ❌ No deployment configuration files (Dockerfile, etc.)

### Frontend Configuration Issues
- ❌ `environment.prod.ts` still has `apiUrl: 'http://localhost:8000/api/v1'` (hardcoded)
- ❌ `authUrl` is hardcoded in both environment files
- ❌ WebSocket service derives URL from `environment.apiUrl` (good, but needs proper base URL)
- ❌ No staging environment configuration
- ❌ No build-time environment variable injection

### Areas Requiring Environment-Aware URLs
1. **Backend:**
   - `FRONTEND_URL` - Used in email invitation links (`email_service.py:47`)
   - `CORS_ORIGINS` - Must include frontend deployment URL
   - WebSocket connections - Derived from API base URL

2. **Frontend:**
   - `apiUrl` - Backend API endpoint
   - `authUrl` - Neon Auth endpoint (may differ per environment)
   - WebSocket URLs - Derived from `apiUrl`

## Deployment Options

### Backend Deployment Options

#### Option 1: Railway (Recommended)
- **Pros:**
  - Easy PostgreSQL integration (can use Neon or Railway's Postgres)
  - Automatic HTTPS
  - Environment variable management
  - Free tier available
  - Simple deployment from GitHub
- **Cons:**
  - Limited free tier resources
- **Cost:** Free tier, then $5-20/month
- **Setup:** Connect GitHub repo, set environment variables, deploy

#### Option 2: Render
- **Pros:**
  - Free tier with PostgreSQL
  - Automatic HTTPS
  - Good documentation
- **Cons:**
  - Free tier spins down after inactivity
  - Slower cold starts
- **Cost:** Free tier, then $7-25/month
- **Setup:** Connect GitHub, configure build/start commands

#### Option 3: Fly.io
- **Pros:**
  - Global edge deployment
  - Good for WebSocket support
  - Docker-based
- **Cons:**
  - More complex setup
  - Requires Docker knowledge
- **Cost:** Free tier, then pay-as-you-go
- **Setup:** Install Fly CLI, configure `fly.toml`, deploy

#### Option 4: DigitalOcean App Platform
- **Pros:**
  - Simple deployment
  - Managed PostgreSQL
  - Good performance
- **Cons:**
  - More expensive
- **Cost:** $5-12/month minimum
- **Setup:** Connect GitHub, configure app spec

**Recommendation:** Railway for simplicity, or Fly.io if WebSocket performance is critical.

### Frontend Deployment Options

#### Option 1: Vercel (Recommended)
- **Pros:**
  - Excellent Angular support
  - Automatic HTTPS
  - Preview deployments for PRs
  - Edge network
  - Free tier is generous
  - Built-in environment variable management
- **Cons:**
  - Serverless (may have cold starts)
- **Cost:** Free tier, then $20/month
- **Setup:** Connect GitHub, configure build settings, set environment variables

#### Option 2: Netlify
- **Pros:**
  - Great Angular support
  - Preview deployments
  - Free tier
  - Easy setup
- **Cons:**
  - Slightly slower than Vercel
- **Cost:** Free tier, then $19/month
- **Setup:** Connect GitHub, configure build settings

#### Option 3: Cloudflare Pages
- **Pros:**
  - Excellent performance (edge network)
  - Free tier
  - Good for static sites
- **Cons:**
  - Less Angular-specific tooling
- **Cost:** Free tier
- **Setup:** Connect GitHub, configure build settings

**Recommendation:** Vercel for best Angular experience and preview deployments.

## Implementation Plan

### Phase 1: Environment Configuration Updates

#### Step 1.1: Backend Environment Configuration
- [ ] Update `config.py` to support environment-based defaults
- [ ] Add `BACKEND_URL` environment variable (for CORS and WebSocket)
- [ ] Update `FRONTEND_URL` to be environment-aware
- [ ] Update `CORS_ORIGINS` to support multiple origins per environment
- [ ] Update `env.example` with deployment examples

#### Step 1.2: Frontend Environment Configuration
- [ ] Create `environment.staging.ts` for staging
- [ ] Update `environment.prod.ts` to use placeholder values (will be replaced at build time)
- [ ] Update Angular build configuration to support environment file replacement
- [ ] Document environment variable injection for deployment platforms

#### Step 1.3: Update Code Using Hardcoded URLs
- [ ] Verify `email_service.py` uses `settings.frontend_url` ✅ (already correct)
- [ ] Verify WebSocket service derives from `environment.apiUrl` ✅ (already correct)
- [ ] Update any other hardcoded URLs if found

### Phase 2: Deployment Configuration Files

#### Step 2.1: Backend Dockerfile
- [ ] Create `backend/Dockerfile` for containerized deployment
- [ ] Create `backend/.dockerignore`
- [ ] Test Docker build locally

#### Step 2.2: Backend Deployment Configuration
- [ ] Create `backend/railway.json` (if using Railway)
- [ ] Create `backend/fly.toml` (if using Fly.io)
- [ ] Create `backend/render.yaml` (if using Render)
- [ ] Document deployment commands

#### Step 2.3: Frontend Deployment Configuration
- [ ] Create `angular-web/vercel.json` (if using Vercel)
- [ ] Create `angular-web/netlify.toml` (if using Netlify)
- [ ] Update `angular.json` build configuration if needed

### Phase 3: Environment Variable Documentation

#### Step 3.1: Backend Environment Variables
- [ ] Document all required environment variables
- [ ] Document environment-specific values
- [ ] Create deployment checklist

#### Step 3.2: Frontend Environment Variables
- [ ] Document build-time environment variables
- [ ] Document platform-specific configuration
- [ ] Create deployment checklist

### Phase 4: Testing & Validation

#### Step 4.1: Local Testing
- [ ] Test with production-like environment variables locally
- [ ] Verify invitation links use correct URLs
- [ ] Verify CORS works with deployment URLs
- [ ] Verify WebSocket connections work

#### Step 4.2: Staging Deployment
- [ ] Deploy backend to staging
- [ ] Deploy frontend to staging
- [ ] Test end-to-end functionality
- [ ] Verify all environment-aware URLs work correctly

#### Step 4.3: Production Deployment
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Final validation
- [ ] Monitor for issues

## Environment Variable Reference

### Backend Environment Variables

| Variable | Development | Staging | Production | Description |
|----------|------------|---------|------------|-------------|
| `ENVIRONMENT` | `development` | `staging` | `production` | Environment identifier |
| `DATABASE_URL` | `sqlite:///./whist.db` | Neon PostgreSQL | Neon PostgreSQL | Database connection string |
| `FRONTEND_URL` | `http://localhost:4200` | `https://staging.yourdomain.com` | `https://yourdomain.com` | Frontend URL for invitation links |
| `BACKEND_URL` | `http://localhost:8000` | `https://api-staging.yourdomain.com` | `https://api.yourdomain.com` | Backend API URL (for CORS) |
| `CORS_ORIGINS` | `["http://localhost:4200"]` | `["https://staging.yourdomain.com"]` | `["https://yourdomain.com"]` | Allowed CORS origins |
| `NEON_AUTH_JWKS_URL` | Dev JWKS URL | Staging JWKS URL | Prod JWKS URL | Neon Auth JWKS endpoint |
| `RESEND_EMAIL` | Dev API key | Staging API key | Prod API key | Resend email API key |
| `FROM_EMAIL` | `onboarding@resend.dev` | Staging email | Production email | Sender email address |

### Frontend Environment Variables (Build-time)

| Variable | Development | Staging | Production | Description |
|----------|------------|---------|------------|-------------|
| `API_URL` | `http://localhost:8000/api/v1` | `https://api-staging.yourdomain.com/api/v1` | `https://api.yourdomain.com/api/v1` | Backend API URL |
| `AUTH_URL` | Dev Neon Auth URL | Staging Neon Auth URL | Prod Neon Auth URL | Neon Auth endpoint |

## Success Criteria

1. ✅ All hardcoded URLs replaced with environment variables
2. ✅ Backend and frontend can be deployed to staging and production
3. ✅ Invitation links work correctly in all environments
4. ✅ CORS configured correctly for each environment
5. ✅ WebSocket connections work in all environments
6. ✅ Environment variables documented and easy to configure
7. ✅ Deployment process is repeatable and documented

## Risks & Mitigation

### Risk 1: WebSocket Support
- **Risk:** Some platforms don't support WebSockets well
- **Mitigation:** Choose platform with WebSocket support (Railway, Fly.io, Render)

### Risk 2: Environment Variable Injection
- **Risk:** Frontend environment variables need build-time injection
- **Mitigation:** Use platform-specific environment variable injection (Vercel/Netlify support this)

### Risk 3: CORS Configuration
- **Risk:** CORS misconfiguration can break frontend-backend communication
- **Mitigation:** Test CORS in staging, document allowed origins clearly

### Risk 4: Database Migrations
- **Risk:** Migrations need to run on deployment
- **Mitigation:** Automate migrations in deployment process, document manual steps

## Next Steps

1. Review and approve this plan
2. Choose deployment platforms (recommendation: Railway + Vercel)
3. Implement Phase 1 (Environment Configuration)
4. Implement Phase 2 (Deployment Files)
5. Test in staging
6. Deploy to production

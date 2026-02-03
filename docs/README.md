# Deployment Guide: whist.orbasker.com

Complete deployment guide for Whist game backend (Render) and frontend (Vercel).

## Domains

- **Frontend:** `whist.orbasker.com` (Vercel)
- **Backend:** `whist.api.orbasker.com` (Render)

## Prerequisites
- [ ] GitHub repository with code
- [ ] Neon PostgreSQL database created
- [ ] Neon Auth configured (get JWKS URL and Auth URL)
- [ ] Resend account with API key
- [ ] Render account (https://render.com)
- [ ] Vercel account (https://vercel.com)
- [ ] DNS access for `orbasker.com`

## Backend Deployment (Render)

### 1. Create Service

1. Go to https://render.com → **New +** → **Web Service**
2. Connect GitHub repository
3. Configure:
   - **Name:** `whist-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install uv && uv sync --frozen --no-dev`
   - **Start Command:** `uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 2. Set Environment Variables

Go to: Render → Your Service → Environment

**Required Variables:**

```
ENVIRONMENT=production
```

```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```
*Get from: Neon Dashboard → Connection Details*

```
FRONTEND_URL=https://whist.orbasker.com
```
⚠️ **CRITICAL:** This must be set to your frontend domain (NOT the API domain). 
Invitation emails will use this URL. If misconfigured, invite links will be broken.

```
BACKEND_URL=https://whist.api.orbasker.com
```

```
CORS_ORIGINS=https://whist.orbasker.com
```

```
NEON_AUTH_JWKS_URL=https://ep-xxx.neonauth.region.aws.neon.tech/neondb/auth/.well-known/jwks.json
```
*Get from: Neon Dashboard → Users → Configuration → JWKS URL*

```
RESEND_EMAIL=re_xxxxxxxxxxxxx
```
*Get from: https://resend.com/api-keys*

```
FROM_EMAIL=noreply@orbasker.com
```
*Use `onboarding@resend.dev` for testing, or verify domain in Resend*

```
INVITATION_SECRET=your-secret-key-here
```
*Optional: Generate a strong random secret*

### 3. Deploy

1. Click **Create Web Service**
2. Wait 5-10 minutes for build
3. Test: `https://whist-backend.onrender.com/api/v1/health`

### 4. Custom Domain

1. Render → Settings → Custom Domain
2. Add: `whist.api.orbasker.com`
3. Add DNS CNAME: `whist.api` → `whist-backend.onrender.com`
4. Wait for verification and SSL

## Frontend Deployment (Vercel)

### 1. Import Project

1. Go to https://vercel.com → **Add New** → **Project**
2. Import GitHub repository
3. Configure:
   - **Root Directory:** `angular-web`
   - **Framework:** Angular (auto-detect)
   - **Build Command:** `npm run build:prod`
   - **Output Directory:** `dist/whist-app/browser`

### 2. Set Environment Variables

Go to: Vercel → Your Project → Settings → Environment Variables

**For Production:**
```
API_URL=https://whist.api.orbasker.com/api/v1
```

```
AUTH_URL=https://ep-xxx.neonauth.region.aws.neon.tech/neondb/auth
```
*Get from: Neon Dashboard → Users → Configuration → Auth URL*

**For Preview (optional, for staging):**
```
API_URL=https://whist.api.orbasker.com/api/v1
```

```
AUTH_URL=https://ep-xxx.neonauth.region.aws.neon.tech/neondb/auth
```

### 3. Deploy

1. Click **Deploy**
2. Wait 3-5 minutes for build
3. Test: `https://your-app.vercel.app`

**Important:** Make sure you've:
- ✅ Pushed latest changes (vercel.json, environment files, scripts)
- ✅ Set `API_URL` and `AUTH_URL` in Vercel dashboard

### 4. Custom Domain

1. Vercel → Settings → Domains
2. Add: `whist.orbasker.com`
3. Add DNS CNAME: `whist` → `cname.vercel-dns.com`
4. Wait for verification and SSL

## DNS Records

Add these in your `orbasker.com` DNS provider:

| Type | Name | Value |
|------|------|-------|
| CNAME | `whist.api` | `whist-backend.onrender.com` |
| CNAME | `whist` | `cname.vercel-dns.com` |

## Verification

### Backend
```bash
curl https://whist.api.orbasker.com/api/v1/health
# Should return: {"status":"healthy"}
```

Visit: `https://whist.api.orbasker.com/docs`

### Frontend
Visit: `https://whist.orbasker.com`

Check browser console (F12):
- ✅ No CORS errors
- ✅ API calls succeed
- ✅ WebSocket connections work

## Troubleshooting

### Invitation Links Not Working (404 Errors)
**Symptoms:** Clicking invite links in emails shows "Not Found" error

**Causes:**
1. `FRONTEND_URL` is not set or set incorrectly in Render
2. `FRONTEND_URL` points to API domain (`whist.api.orbasker.com`) instead of frontend (`whist.orbasker.com`)
3. `ENVIRONMENT` is not set to `production` in Render

**Fix:**
1. Go to Render → Your Service → Environment
2. Verify `ENVIRONMENT=production` is set
3. Verify `FRONTEND_URL=https://whist.orbasker.com` (NOT `whist.api.orbasker.com`)
4. Restart the service after updating
5. Check backend logs for warnings about frontend URL configuration

**Note:** The backend now includes a redirect endpoint at `/api/v1/invite/{token}/redirect` as a fallback, but the correct fix is to set `FRONTEND_URL` properly.

### Frontend 404 Errors
1. Push latest changes (vercel.json, environment files, scripts)
2. Set `API_URL` and `AUTH_URL` in Vercel dashboard
3. Redeploy

### CORS Errors
- Verify `CORS_ORIGINS` in Render includes `https://whist.orbasker.com`
- Restart Render service after updating env vars

### DNS Not Resolving
- Wait 5-60 minutes for propagation
- Check DNS records are correct

## Environment Variables Quick Reference

| Variable | Where to Get |
|----------|--------------|
| `DATABASE_URL` | Neon Dashboard → Connection Details |
| `NEON_AUTH_JWKS_URL` | Neon Dashboard → Users → Configuration → JWKS URL |
| `AUTH_URL` | Neon Dashboard → Users → Configuration → Auth URL |
| `RESEND_EMAIL` | https://resend.com/api-keys |
| `INVITATION_SECRET` | Generate random secret (optional) |

## Next Steps

1. Complete environment variable setup (see sections above)
2. Deploy backend
3. Deploy frontend
4. Test all functionality
5. Commit changes

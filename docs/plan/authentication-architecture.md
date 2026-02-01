# Authentication Architecture: better-auth + Neon PostgreSQL

## Overview

This document defines the complete authentication architecture for the Wist game application using **better-auth** (TypeScript/Node) and **Neon PostgreSQL**. The Wist backend is FastAPI (Python); better-auth runs as a separate auth service that shares the same Neon database and issues session/JWT tokens that FastAPI validates for protected API calls.

### Objectives

- **Authenticate users** via better-auth (email/password and optional OAuth).
- **Store auth and app data** in a single Neon PostgreSQL database (users/sessions in better-auth tables; games/rounds in existing FastAPI schema).
- **Authorize API requests** by having FastAPI verify the session or JWT produced by better-auth.
- **Migrate** from the current SQLite dev setup to Neon PostgreSQL with a clear, reversible path.

### Scope

- better-auth integration patterns with FastAPI (split service + shared DB).
- User and authentication schema (better-auth core tables + `games.owner_id` / `games.player_user_ids`).
- Auth flows: signup, login, logout, password reset, email verification.
- Session management and JWT/token handling for FastAPI.
- Security considerations (hashing, CSRF, cookies, secrets).
- Migration plan from SQLite to Neon PostgreSQL.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Frontend (Angular)                                                          │
│  - better-auth client: signIn, signUp, signOut, getSession                    │
│  - API calls to FastAPI with session cookie or Authorization: Bearer <JWT>  │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  better-auth  │   │  FastAPI      │   │  Neon          │
│  (Node/Hono)  │   │  Backend      │   │  PostgreSQL    │
│               │   │               │   │                │
│  /api/auth/*  │   │  /api/v1/*    │   │  user          │
│  - signup     │   │  - games      │   │  session       │
│  - login      │   │  - rounds     │   │  account       │
│  - session    │   │  - validate   │   │  verification  │
│  - JWT/cookie │   │    JWT/session│   │  games         │
└───────┬───────┘   └───────┬───────┘   │  rounds        │
        │                   │           └────────┬───────┘
        └───────────────────┴────────────────────┘
                    Shared DATABASE_URL
```

- **better-auth**: TypeScript/Node service (e.g. Hono or Express) mounted at `/api/auth/*`. Uses Neon PostgreSQL for `user`, `session`, `account`, `verification`. Supports email/password and optional OAuth; issues session cookie and optionally a JWT for API use.
- **FastAPI**: Existing game/rounds API. For protected routes, validates the JWT or session token (same secret as better-auth or session lookup in DB) and uses `user_id` for authorization (`owner_id`, `player_user_ids`).
- **Neon PostgreSQL**: Single database; better-auth tables + existing `games` and `rounds`. `games.owner_id` references `user.id`; `games.player_user_ids` is a JSON array of `user.id` (or null) per seat.

---

## 1. better-auth Integration with FastAPI

### 1.1 Why better-auth is separate from FastAPI

better-auth is a **TypeScript/Node** library. It does not run inside FastAPI. Two practical options:

1. **Dedicated auth service (recommended)**  
   - Run better-auth on a small Node server (e.g. Hono) that shares the same Neon PostgreSQL URL.  
   - Frontend calls this service for `/api/auth/*` (signup, login, logout, getSession, etc.).  
   - For FastAPI, frontend sends the session (cookie or JWT). FastAPI validates the JWT with the same secret (when using cookie cache strategy `jwt`) or checks the session in the shared DB.

2. **BFF (Backend-for-Frontend)**  
   - Single Node app that mounts better-auth at `/api/auth/*` and proxies `/api/v1/*` to FastAPI.  
   - BFF reads the session from the cookie, then calls FastAPI with an internal header (e.g. `X-User-Id`) or a short-lived JWT.  
   - Reduces CORS and cookie scope issues; adds one more hop and deployment piece.

**Recommendation:** Start with **(1) dedicated auth service** and same-domain deployment (e.g. same host, different path: `/api/auth` → Node, `/api/v1` → FastAPI) so the session cookie set by better-auth is sent to both. Use **cookie cache strategy `jwt`** so FastAPI can verify the token with a shared secret without calling the auth service on every request.

### 1.2 Integration pattern: shared secret + JWT

- better-auth: enable `session.cookieCache` with `strategy: "jwt"` and a strong `BETTER_AUTH_SECRET`.
- Expose the **same secret** to FastAPI (e.g. `BETTER_AUTH_SECRET` or `AUTH_JWT_SECRET` in env). Do not expose it to the browser.
- better-auth stores sessions in Neon and can put a short-lived JWT in a cookie (or you add a small endpoint that returns a JWT for the current session for `Authorization: Bearer`).
- FastAPI: on protected routes, read `Authorization: Bearer <token>` or the session cookie (if same domain), verify the JWT with the shared secret, and use `sub` (user id) for authorization.

### 1.3 CORS and cookies

- Auth service and FastAPI should be reachable under the **same site** (e.g. `api.wist.example.com`) so the session cookie is sent to both.
- If auth and API are on different subdomains, use `SameSite=None; Secure` and configure CORS to allow the frontend origin with credentials. Prefer same host/path-based routing to avoid cookie scope issues.

---

## 2. Database Schema Design

### 2.1 better-auth core schema (Neon PostgreSQL)

These tables are created by better-auth CLI (`npx @better-auth/cli generate` / `migrate`) or manually. Use **UUID** for `user.id` so it matches existing `games.owner_id` (UUID). better-auth supports `advanced.database.generateId: "uuid"`.

| Table       | Purpose |
|------------|---------|
| **user**   | User profile and identity. |
| **session**| Active sessions (token, userId, expiresAt). |
| **account**| Linked accounts (email/password or OAuth provider). |
| **verification** | Email verification and password reset tokens. |

**user** (better-auth default names; can be customized with `user.modelName` / `user.fields`):

| Field         | Type      | Key | Description |
|---------------|-----------|-----|-------------|
| id            | string (UUID) | PK  | Unique user id (used in `games.owner_id` and `player_user_ids`). |
| name          | string    | -   | Display name. |
| email         | string    | -   | Email (login and communication). |
| emailVerified | boolean   | -   | Whether email is verified. |
| image         | string?   | -   | Avatar URL. |
| createdAt     | timestamp | -   | Created at. |
| updatedAt     | timestamp | -   | Updated at. |

**session**:

| Field     | Type      | Key | Description |
|-----------|-----------|-----|-------------|
| id        | string    | PK  | Session id. |
| userId    | string (UUID) | FK  | References user.id. |
| token     | string    | -   | Session token (used in cookie). |
| expiresAt | timestamp | -   | Expiration. |
| ipAddress | string?   | -   | Client IP. |
| userAgent | string?   | -   | Client user agent. |
| createdAt | timestamp | -   | Created at. |
| updatedAt | timestamp | -   | Updated at. |

**account** (per provider / credential):

| Field               | Type      | Key | Description |
|---------------------|-----------|-----|-------------|
| id                  | string    | PK  | Account id. |
| userId              | string (UUID) | FK  | user.id. |
| accountId           | string    | -   | Provider account id or same as userId for credentials. |
| providerId          | string    | -   | e.g. "credential", "google", "github". |
| accessToken         | string?   | -   | OAuth access token. |
| refreshToken        | string?   | -   | OAuth refresh token. |
| accessTokenExpiresAt| timestamp?| -   | Access token expiry. |
| refreshTokenExpiresAt| timestamp?| -  | Refresh token expiry. |
| scope               | string?   | -   | OAuth scope. |
| idToken             | string?   | -   | OAuth id token. |
| password            | string?   | -   | Hashed password (credential). |
| createdAt           | timestamp | -   | Created at. |
| updatedAt           | timestamp | -   | Updated at. |

**verification** (email verification, password reset):

| Field      | Type      | Key | Description |
|------------|-----------|-----|-------------|
| id         | string    | PK  | Verification id. |
| identifier | string    | -   | Request identifier. |
| value      | string    | -   | Token or value to verify. |
| expiresAt  | timestamp | -   | Expiry. |
| createdAt  | timestamp | -   | Created at. |
| updatedAt  | timestamp | -   | Updated at. |

### 2.2 Wist app schema (existing + FK to user)

Existing tables stay; add a **foreign key** from `games.owner_id` to `user.id` once the `user` table exists in Neon:

```sql
-- games.owner_id already exists (UUID, nullable)
-- Add FK when user table is in same DB (Neon)
ALTER TABLE games
  ADD CONSTRAINT fk_games_owner
  FOREIGN KEY (owner_id) REFERENCES "user"(id) ON DELETE SET NULL;

-- player_user_ids remains JSON: [user_id1, null, null, null]
-- No separate FK table required for Phase 1; optional game_participants later.
```

- **owner_id**: UUID, nullable, references `user.id`. Set when a logged-in user creates the game.
- **player_user_ids**: JSON array of four elements (UUID or null). Maps each seat to a user id when known.

No separate `users` table in FastAPI; the single source of truth for users is better-auth’s `user` table in Neon.

---

## 3. Authentication Flows

### 3.1 Signup (email/password)

1. Frontend: `authClient.signUp.email({ email, password, name, callbackURL })`.
2. better-auth: validate input, hash password (built-in), create `user` and `account` (providerId `credential`), create `session`, set session cookie (and optionally return JWT).
3. If **email verification** is enabled: create `verification` row, send email with link; user is considered unverified until they complete the link. Optionally restrict game creation to verified users only.

### 3.2 Login (email/password)

1. Frontend: `authClient.signIn.email({ email, password, callbackURL, rememberMe })`.
2. better-auth: verify credentials, find or create session, set cookie (and optional JWT).
3. Session duration and refresh follow `session.expiresIn` and `session.updateAge`.

### 3.3 Logout

1. Frontend: `authClient.signOut()`.
2. better-auth: invalidate session (delete or mark expired), clear cookie.

### 3.4 Password reset

1. Frontend: request reset (e.g. `authClient.forgetPassword({ email })` or custom endpoint using better-auth’s verification).
2. better-auth: create `verification` record with short-lived token, send email with link.
3. User clicks link; frontend calls reset-password endpoint with token and new password.
4. better-auth: verify token, update `account.password` (hash), invalidate verification, optionally revoke other sessions.

(Use better-auth’s built-in or plugin flows for “forget password” and “reset password” if available; otherwise implement with the `verification` table.)

### 3.5 Email verification

1. On signup (if enabled): better-auth creates a `verification` row and sends an email with a link.
2. User clicks link; frontend or backend calls verify-email endpoint with token.
3. better-auth: validate token, set `user.emailVerified = true`, delete verification row.
4. Optional: allow only verified users to create or join games (enforced in FastAPI or auth service).

---

## 4. Session Management Strategy

### 4.1 Session duration (design decision)

- **Recommendation:**  
  - **expiresIn**: 7 days (default).  
  - **updateAge**: 1 day (session extended when used at least once per day).  
- Rationale: balance between security (shorter) and UX (fewer logins). Can be tightened (e.g. 24h + 1h updateAge) for higher security.

Configuration in better-auth:

```ts
session: {
  expiresIn: 60 * 60 * 24 * 7,  // 7 days
  updateAge: 60 * 60 * 24,      // 1 day
}
```

### 4.2 Cookie cache (for FastAPI JWT verification)

- Enable **cookie cache** so the session can be represented as a JWT and verified by FastAPI without a DB lookup on every request:
  - `session.cookieCache.enabled: true`
  - `session.cookieCache.strategy: "jwt"`
  - `session.cookieCache.maxAge`: e.g. 5 minutes (short-lived cache; refresh from DB when expired).
- FastAPI uses the same `BETTER_AUTH_SECRET` to verify the JWT and read `sub` (user id).

### 4.3 Refresh tokens (design decision)

- better-auth uses **session-based** model: the session is stored in DB (and optionally in a cookie cache JWT). There is no separate “refresh token” entity; “refresh” is done by **updateAge** (sliding window) or by re-validation against the session table.
- **Recommendation:** Use the built-in session + cookie cache; no extra refresh token flow. If the frontend sends an expired JWT, FastAPI returns 401 and the frontend can call better-auth’s getSession (with cookie) to get a fresh session/JWT.

---

## 5. JWT / Token Handling for FastAPI

### 5.1 Where the token comes from

- **Option A (same domain):** Cookie set by better-auth is sent to FastAPI. FastAPI reads the cookie (e.g. `better-auth.session_token` or the cookie cache cookie), verifies it as JWT with shared secret, and uses `sub` as `user_id`.
- **Option B (cross-origin or SPA):** Auth service exposes an endpoint (e.g. `GET /api/auth/session`) that returns the current session; frontend sends the session token or a short-lived JWT in `Authorization: Bearer <token>` to FastAPI. FastAPI verifies the JWT with the shared secret.

### 5.2 FastAPI dependency

- Read token from `Authorization: Bearer <token>` or from the session cookie (if same domain).
- Decode JWT with PyJWT (or python-jose), algorithm HS256, secret = `BETTER_AUTH_SECRET`.
- Validate `exp`, and optionally `iat`; extract `sub` as `user_id` (UUID string).
- Raise 401 if missing or invalid. Use `user_id` in route logic (e.g. set `owner_id`, check `player_user_ids`).

Example (conceptual):

```python
# app/core/auth.py
def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
    cookie: str = Cookie(None, alias="better-auth.session_token"),
) -> str:
    token = (credentials.credentials if credentials else None) or cookie
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, settings.auth_jwt_secret, algorithms=["HS256"])
        return str(payload["sub"])
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
```

### 5.3 Optional: session lookup in DB

If not using JWT (e.g. long-lived session token only), FastAPI can validate by checking the `session` table in Neon: look up by token, check `expiresAt` and `userId`, and use `userId` for authorization. This requires a DB round-trip per request unless you add a short-lived JWT layer as above.

---

## 6. User-to-Game Relationships

Existing Game model already has:

- **owner_id**: UUID, nullable. Set when an authenticated user creates the game. FK to `user.id` (in Neon).
- **player_user_ids**: JSON array of four elements (UUID or null). Maps seat index to user id when the player is logged in.

Authorization rules (enforced in FastAPI):

- **Create game:** Require auth; set `owner_id = current_user_id`. Optionally set `player_user_ids[0] = current_user_id`.
- **Get game:** Allow if unauthenticated (current behavior) or if authenticated and (game.owner_id == user_id or user_id in game.player_user_ids). For “my games” list: filter by `owner_id = user_id` or `user_id = any(player_user_ids)`.
- **Update game / submit bids or tricks:** Allow if authenticated and (owner_id == user_id or user_id in player_user_ids); optionally restrict by seat for tricks.

No schema change beyond adding the FK on `owner_id`; keep `player_user_ids` as JSON for simplicity unless you introduce a `game_participants` table later.

---

## 7. API Endpoint Design

### 7.1 better-auth (auth service)

All under `/api/auth/*` (or configured base path). Handled by better-auth; no custom FastAPI routes.

| Method | Path (relative to base) | Purpose |
|--------|--------------------------|---------|
| POST   | /sign-up/email            | Email/password signup. |
| POST   | /sign-in/email            | Email/password login. |
| POST   | /sign-out                 | Logout (invalidate session). |
| GET    | /get-session              | Get current session (and user). |
| POST   | /sign-in/social           | OAuth sign-in (redirect or token). |
| POST   | /forget-password           | Request password reset (if supported). |
| POST   | /reset-password            | Reset password with token. |
| GET/POST | /verify-email / callback  | Email verification (if enabled). |

Exact paths depend on better-auth version; refer to its API docs.

### 7.2 FastAPI (existing + auth-aware)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST   | /api/v1/games             | Optional → Recommended | Create game; if authenticated, set owner_id. |
| GET    | /api/v1/games/{id}         | Optional | Get game (allow if public or participant). |
| PUT    | /api/v1/games/{id}         | Optional | Update game (owner or participant). |
| GET    | /api/v1/games              | Recommended | List games (if authenticated: filter by owner_id / player_user_ids). |
| POST   | /api/v1/games/{id}/rounds/bids   | Optional | Submit bids (owner or participant). |
| POST   | /api/v1/games/{id}/rounds/tricks | Optional | Submit tricks (owner or participant). |

Use dependency `get_current_user_id` for routes that must be authenticated; use optional auth for backward compatibility during migration.

---

## 8. Security Considerations

### 8.1 Password hashing

- better-auth uses a **secure default** (e.g. bcrypt or argon2). Do not disable or replace with a weaker algorithm. No custom hashing in FastAPI for passwords.

### 8.2 Secrets

- **BETTER_AUTH_SECRET**: High-entropy, ≥32 characters. Used for signing cookies and JWTs. Store in env; same value for auth service and FastAPI when verifying JWT. Rotate by changing secret and invalidating existing sessions (cookie cache version or session table wipe).
- **Database URL**: Use Neon’s connection string in env; restrict to application role; use connection pooling (Neon supports it).

### 8.3 CSRF

- better-auth uses **SameSite** cookies and optional CSRF tokens for state-changing auth actions. Keep SameSite (Lax or Strict) for same-site deployment; use SameSite=None; Secure only if cross-site is required.
- FastAPI: for any cookie-based auth, ensure CORS and SameSite are aligned; for Bearer-only API, CSRF is less of an issue but still avoid state-changing operations via GET.

### 8.4 HTTPS and cookies

- In production, use **HTTPS** only. Set cookies with **Secure** and **HttpOnly** where possible (better-auth sets session cookie; ensure no sensitive token is exposed to JS unless required for Bearer header).

### 8.5 Rate limiting and abuse

- better-auth has built-in rate limiting; enable it for sign-in and sign-up.
- FastAPI: add rate limiting on auth-related proxy endpoints if any, and on game creation to prevent abuse.

### 8.6 Email verification and password reset

- Use **short-lived** verification tokens (e.g. 1 hour); store in `verification` table with `expiresAt`.
- Password reset: invalidate all sessions after reset (better-auth option or custom hook).
- Do not leak existence of emails (e.g. “if an account exists, we sent an email” is acceptable; avoid “this email is not registered” in production).

---

## 9. Migration Plan: SQLite → Neon PostgreSQL

### 9.1 Phases

1. **Prepare Neon and schema**
   - Create Neon project and database; get connection string.
   - Run better-auth migrations (or generate SQL) to create `user`, `session`, `account`, `verification` in Neon.
   - Run existing Alembic (or SQL) migrations for `games` and `rounds` on Neon so schema matches current app (with optional `owner_id` FK to `user` deferred until auth tables exist).

2. **Dual-write / cutover**
   - **Option A (big-bang):** Point FastAPI and the new auth service only at Neon; retire SQLite. No data migration if current SQLite has no production users.
   - **Option B (with data):** If SQLite has data to keep:
     - Add Alembic migration that uses Neon as target; run migrations on Neon.
     - Export from SQLite (games, rounds) and import into Neon (scripts or one-off ETL). No `owner_id` or `player_user_ids` to migrate if auth did not exist.
     - Switch env to Neon; run both backends against Neon.

3. **Auth service and FastAPI**
   - Deploy better-auth (Node) with `DATABASE_URL` = Neon URL; run better-auth migrations.
   - Configure FastAPI with same Neon URL for app data and `AUTH_JWT_SECRET` = `BETTER_AUTH_SECRET` for JWT verification.
   - Add `get_current_user_id` and protect routes as needed; keep optional auth where backward compatibility is required.

4. **Rollback**
   - Keep SQLite URL and previous env in version control or secrets. To rollback: point FastAPI back to SQLite; disable or bypass auth checks if they were optional. Auth service can stay on Neon for new signups; existing SQLite data remains read-only or re-imported if needed.

### 9.2 Configuration

- **Local/dev:** Use Neon branch (e.g. dev) or a separate Neon DB for development; same schema, different URL.
- **Staging/prod:** Use Neon production branch; separate connection string; connection pooling (Neon pooler) recommended.
- **Env vars:**
  - Auth service: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL` (Neon).
  - FastAPI: `DATABASE_URL` (Neon), `AUTH_JWT_SECRET` (= `BETTER_AUTH_SECRET`), CORS origins.

### 9.3 Alembic and better-auth

- Alembic: continue to manage `games` and `rounds` only. Do not manage better-auth tables with Alembic; use better-auth CLI for those.
- Order: run better-auth migrations first (so `user` exists), then add Alembic migration that adds FK `games.owner_id` → `user.id` if desired.

---

## 10. Design Decisions (Questions Answered)

### 10.1 OAuth providers vs email/password only

- **Recommendation:** Start with **email/password only**; add **OAuth (e.g. Google, GitHub)** in a later phase if needed.
- Rationale: Simpler initial scope; better-auth supports both. OAuth requires provider app registration and callback URLs; can be added without schema changes.

### 10.2 Email verification

- **Recommendation:** **Yes, but optional at first.** Implement verification (better-auth’s verification table + email sending). Initially, do not block game creation on verified email; later, you can require `emailVerified` for creating or joining games.
- Rationale: Reduces fake accounts and improves deliverability; optional rollout reduces friction during launch.

### 10.3 Session duration

- **Recommendation:** **7 days** expiry, **1 day** updateAge (sliding window). Adjust to 24h + 1h for stricter security if required.

### 10.4 Refresh tokens

- **Recommendation:** **No separate refresh token.** Use better-auth’s session + cookie cache (JWT). Session is extended by updateAge; when the JWT in the cookie cache expires, the frontend can call getSession again (with cookie) to refresh. FastAPI returns 401 on expired JWT; client refreshes session and retries.

---

## 11. Deliverables Checklist

- [x] **Architecture document** (this file): `docs/plan/authentication-architecture.md`
- [x] **Database schema design**: better-auth core tables (user, session, account, verification) + games.owner_id / player_user_ids and FK to user
- [x] **API endpoint design**: better-auth routes under `/api/auth/*`; FastAPI routes auth-aware with optional/required `get_current_user_id`
- [x] **Security considerations**: hashing, secrets, CSRF, HTTPS, cookies, rate limiting, email verification and password reset
- [x] **Migration plan**: SQLite → Neon PostgreSQL (prepare schema, dual-write/cutover, auth service + FastAPI config, rollback)

---

## 12. References

- better-auth: https://www.better-auth.com/  
- better-auth docs: Installation, Basic Usage, Database (core schema), Session Management  
- Neon PostgreSQL: https://neon.tech/  
- Existing Wist: `docs/plan/backend-architecture.md`, `docs/plan/supabase-integration.md` (replaced by this auth design)

---

**Status:** Design complete; ready for implementation planning and backend/auth service setup.

# Security Audit and Improvements

**Date:** 2025-02-20  
**Scope:** Auth token handling, API authorization, input validation, CORS, sensitive data exposure, dependency vulnerabilities.

---

## 1. Auth Token Handling

### Findings
- **Backend:** JWT verification uses Neon Auth JWKS (RS256/EdDSA), expiry and signature verified. Tokens accepted from `Authorization: Bearer` or `neon-auth.session_token` cookie.
- **Issue:** 401/503 error responses exposed raw exception messages (`str(e)`), which could leak internal details (e.g. JWT decode errors).
- **Frontend:** Token read from `localStorage` key `neon-auth.session_token` and sent via `Authorization: Bearer` and `withCredentials`. Console logged token length in debug.

### Fixes Implemented
- **Backend:** Genericized auth error messages: return "Invalid or expired token" for 401 and "Authentication service unavailable" for 503 instead of `str(e)`. Detailed errors logged server-side only.
- **Frontend:** No change to token storage (Neon Auth client may rely on localStorage). Consider moving to httpOnly cookies if Neon Auth supports it in future to reduce XSS impact.

---

## 2. API Authorization

### Findings
- **Critical:** `GET /api/v1/games/{game_id}` and `PUT /api/v1/games/{game_id}` had **no authentication**; any client could read or update any game by ID.
- **Critical:** `POST /api/v1/games/{game_id}/rounds/bids`, `POST .../rounds/tricks`, and `GET .../rounds/` had **no authentication**; any client could submit bids/tricks or list rounds for any game.
- **WebSocket** `/ws/games/{game_id}` had **no authentication**; any client could connect and send `submit_bids` / `submit_tricks` and other commands.

### Fixes Implemented
- **Games:** `get_game` and `update_game` now require authentication via `get_current_user_id`. Access is restricted to **participants only** (owner or player in `player_user_ids`). Added `get_game_if_participant()` in `GameService` and use it for both endpoints.
- **Rounds:** `submit_bids`, `submit_tricks`, and `get_rounds` now require authentication. Same participant check: only users who are owner or a player in the game can access.
- **WebSocket:** Connection now requires a valid JWT via query parameter `token`. Token is verified with existing JWKS verification; the user must be a **participant** in the game. Connections without a valid token or non-participant are closed with policy violation.

---

## 3. Input Validation

### Findings
- **Round schemas:** `RoundCreate.bids` and `TricksSubmit.bids` / `TricksSubmit.tricks` had `min_length=4, max_length=4` but no per-element range; service layer enforced 0–13.
- **GameUpdate:** Allows `scores`, `current_round`, `status`; now protected by auth and participant check so only participants can update (game logic still validates internally).

### Fixes Implemented
- **Round schemas:** Added Pydantic `field_validator`s so each bid and trick is in range 0–13. This gives consistent validation at the API boundary and clear 422 responses.

---

## 4. CORS

### Findings
- CORS uses `effective_cors_origins` from config (env-specific). Production defaults to frontend URL only; development allows `localhost:4200` and `localhost:3000`.
- `allow_credentials=True` (needed for cookie auth), `allow_methods=["*"]`, `allow_headers=["*"]`.

### Fixes Implemented
- No change. Configuration is appropriate: origins are explicit per environment; wildcard methods/headers are acceptable when origins are restricted.

---

## 5. Sensitive Data Exposure

### Findings
- **Auth:** 401/503 details exposed exception messages (fixed in §1).
- **Invitations:** `POST /api/v1/invite/games/{game_id}/invite` response included `tokens` (raw invitation JWTs) "for testing/debugging", exposing sensitive tokens to the client.
- **Invitation secret:** Default fallback `"change-me-in-production"` when neither `invitation_secret` nor `resend_email` is set; in production this would be insecure.

### Fixes Implemented
- **Invitations:** Removed `tokens` from the API response. Invitation links are sent by email only; clients no longer receive raw tokens.
- **Invitation secret:** In `core/invitations.py`, if `invitation_secret` is empty or the literal `"change-me-in-production"` and we are in production (or the secret is weak), a warning is logged. Application still runs; operators should set `INVITATION_SECRET` in production.

---

## 6. Dependency Vulnerabilities

### Findings
- Backend and frontend dependencies should be audited regularly for known vulnerabilities.
- **Backend:** Run `cd backend && uv run pip-audit` (or `pip-audit` in the venv) to check for known CVEs. No critical issues were identified in the current pinned set at audit time.
- **Frontend:** `npm audit` reports multiple high/moderate issues, including:
  - Angular core/common/compiler XSS and XSRF-related advisories (GHSA-*); fixes typically require upgrading to a patched Angular version (e.g. 19.2.x or 21.x).
  - Dev/build-time deps: ajv, minimatch, esbuild, tar, qs, tmp. Many are in the tooling chain; address with `npm audit fix` where possible and plan upgrades for breaking changes.

### Recommendations
- **Backend:** Run `pip-audit` regularly and address reported issues. Keep `fastapi`, `pyjwt`, `cryptography`, `httpx`, and `pydantic` updated.
- **Frontend:** Run `npm audit` and apply `npm audit fix` for non-breaking fixes. Plan an Angular (and related) upgrade for XSS/XSRF patches; avoid `npm audit fix --force` without testing.

---

## Summary of Code Changes

| Area           | File(s) | Change |
|----------------|---------|--------|
| Auth errors    | `backend/app/core/auth.py` | Generic 401/503 messages; no `str(e)` in responses |
| Game access    | `backend/app/services/game_service.py` | `get_game_if_participant()` added |
| Games API      | `backend/app/views/games.py` | `get_game`, `update_game` require auth + participant |
| Rounds API     | `backend/app/views/rounds.py` | All endpoints require auth + participant |
| WebSocket      | `backend/app/views/websocket.py` | Require `token` query param; verify JWT and participant |
| Round schemas  | `backend/app/schemas/round.py` | Validators for bid/trick in 0–13 |
| Invitations    | `backend/app/views/invitations.py` | Removed `tokens` from response |
| Invitation secret | `backend/app/core/invitations.py` | Log warning for weak/default secret in production |

---

## Verification

After applying fixes:

1. Run backend tests: `cd backend && uv run pytest`.
2. Run pre-commit: `pre-commit run --all-files`.
3. Start backend and frontend and verify: listing games, opening a game, submitting bids/tricks, and WebSocket updates all require login and only allow access for participants.

# Neon Auth API contract (Flutter & Angular)

This document defines the **request and response contract** for Neon Auth used by both the **Angular web app** and the **Flutter mobile app**. Both clients call the same Neon Auth backend; any difference in URL, headers, or body shape can cause sign-in/sign-up or session handling to fail on one client.

**Neon Auth** is a managed REST API (Better Auth) that connects to your Neon database. Base URL is configured per environment (e.g. `https://ep-xxx.neonauth.region.aws.neon.tech/neondb/auth`). All paths below are **relative to that base URL**.

---

## Base URL

| Client   | Config location                                      | Must match |
|----------|------------------------------------------------------|------------|
| Angular  | `environment.authUrl` (e.g. `environment.ts`)         | Same value |
| Flutter  | `AuthConfig.authBaseUrl` (`lib/config/auth_config.dart`) | Same value |

Override at build/run:

- **Angular**: `AUTH_URL` via `replace-env.js` / `.env`
- **Flutter**: `--dart-define=AUTH_BASE_URL=...`

---

## Endpoints

### 1. Sign-in (email/password)

**Request**

- **Method:** `POST`
- **Path:** `sign-in/email`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response (success, 200)**

- Body is JSON. Session token can appear under any of (in order of precedence used by Flutter/Angular):
  - `data.session.token`
  - `data.session.accessToken`
  - `data.session.access_token` (Neon Auth snake_case)
  - `data.token`
  - `session.token` / `session.accessToken` / `session.access_token`
  - top-level `token`
- User object: `data.user` or `user` (id, email, name; optional fields like emailVerified).

Example (Neon Auth style):

```json
{
  "data": {
    "session": {
      "access_token": "eyJhbGc...",
      "expires_at": 1763848395
    },
    "user": {
      "id": "dc42fa70-09a7-4038-a3bb-f61dda854910",
      "email": "user@example.com",
      "emailVerified": true
    }
  }
}
```

**Response (error, 4xx)**

- JSON body with `message`, `error`, or `code` (string). Flutter/Angular map these to user-facing messages.

---

### 2. Sign-up (email/password)

**Request**

- **Method:** `POST`
- **Path:** `sign-up/email`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**

```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "name": "New User"
}
```

**Response**

- Same shape as sign-in (success: session token + user; error: message/error/code).

---

### 3. Get session

**Request**

- **Method:** `GET`
- **Path:** `get-session`
- **Headers:** `Authorization: Bearer <JWT>` (session token from sign-in/sign-up)

**Response (success, 200)**

- JSON with `data.session` (and optionally token under same paths as above) and `data.user` (or `user`). Used to refresh user info and confirm session validity.

---

### 4. Sign-out

**Request**

- **Method:** `POST`
- **Path:** `sign-out`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <JWT>`

**Response**

- Success: session invalidated. Client must clear stored token regardless of status.

---

## Token storage and API usage

| Client   | Token storage                    | Usage for Whist API              |
|----------|-----------------------------------|----------------------------------|
| Angular  | `localStorage['neon-auth.session_token']` (and/or cookie) | `Authorization: Bearer <token>` via interceptor for `/api/v1/` |
| Flutter  | `FlutterSecureStorage` key `neon-auth.session_token` | `Authorization: Bearer <token>` via `ApiService` (getToken) for all backend requests |

After sign-in/sign-up:

1. Client extracts JWT from response (see paths above) and stores it.
2. All requests to the **Whist backend** (`/api/v1/*`) must send `Authorization: Bearer <token>`.
3. Backend validates the JWT using Neon Auth JWKS (see `backend/app/core/auth.py`).

---

## Differences and alignment

- **Token field name:** Neon Auth may return `access_token` (snake_case). Flutter’s `NeonAuthResponseParser` and Angular’s `getToken()` both accept `token`, `accessToken`, and `access_token` so both clients work with the same backend response.
- **Cookies:** Angular may receive an HTTP-only session cookie from Neon Auth; Flutter typically does not use cookies for the same domain and relies on the stored JWT and `Authorization` header. Both are valid; the backend accepts Bearer token (and optionally cookie) for verification.
- **No request/response differences** are required between Flutter and Angular for email/password sign-in, sign-up, get-session, and sign-out when this contract is followed.

---

## References

- [Neon Auth – Authentication flow](https://neon.tech/docs/auth/authentication-flow)
- Backend JWT verification: `backend/app/core/auth.py`
- Angular: `angular-web/src/app/core/services/auth.service.ts`, `auth.interceptor.ts`
- Flutter: `flutter_mobile/lib/services/auth_service.dart`, `api_service.dart`

# Whist Flutter app

Mobile app for Whist (iOS and Android). Uses the same backend as the Angular web app (Whist API).

## Setup

- Flutter SDK (e.g. 3.10+).
- From repo root, backend should be running for local API (e.g. `cd backend && uv run uvicorn app.main:app --reload`).

## Config (API URL & Auth URL)

Values are set via **dart-define** at run/build time. Defaults point to local Whist API and Neon Auth (same as Angular).

| Variable   | Default (dev) |
|-----------|----------------|
| `API_URL` | `http://localhost:8000/api/v1` |
| `AUTH_URL` | Neon Auth URL (see `.env.example`) |

**Run with defaults (local backend):**

```bash
cd apps/flutter
flutter run
```

**Run with custom API/Auth URLs:**

```bash
flutter run --dart-define=API_URL=https://api.example.com/api/v1 --dart-define=AUTH_URL=https://ep-xxx.neonauth.../neondb/auth
```

**Build release (example):**

```bash
flutter build apk --dart-define=API_URL=... --dart-define=AUTH_URL=...
flutter build ios --dart-define=API_URL=... --dart-define=AUTH_URL=...
```

Optional: copy `.env.example` to `.env` and use a script or IDE run config to pass these into `--dart-define` for local dev.

## Targets

- **iOS** – `ios/`
- **Android** – `android/`

## Structure

- `lib/main.dart` – App entry and home.
- `lib/config/app_config.dart` – `AppConfig.apiUrl`, `AppConfig.authUrl` (from dart-define).

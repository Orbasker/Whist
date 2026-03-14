# whist_flutter

Whist game scoring – Flutter app (same auth and API as the Angular web app).

## Auth configuration

Auth base URL is defined in **`lib/config/auth_config.dart`** (`AuthConfig.authBaseUrl`). It defaults to the same Neon Auth URL as the Angular app. **This value must match** Angular’s `environment.authUrl` (in `angular-web/src/environments/`) so both clients talk to the same Neon Auth backend. Request/response contract (sign-in, sign-up, get-session, token shape) is documented in **`docs/neon-auth-api-contract.md`** (repo root).

To override at run/build time:

- `flutter run --dart-define=AUTH_BASE_URL=https://...`
- `flutter build apk --dart-define=AUTH_BASE_URL=...`

## Getting Started

### Google Sign-In (optional)

Login with Google uses the same Neon Auth backend as the web app. To enable it:

1. **Google Cloud Console**: In the same project used for Neon Auth (or your web app), create an **iOS** OAuth 2.0 Client ID (Credentials → Create credentials → OAuth client ID → iOS). Note the **iOS client ID** (e.g. `123-xxx.apps.googleusercontent.com`).
2. **iOS**: In `ios/Runner/Info.plist`, replace `com.googleusercontent.apps.YOUR-IOS-CLIENT-ID-REVERSED` in `CFBundleURLSchemes` with your **reversed** iOS client ID (e.g. if the client ID is `123-abc.apps.googleusercontent.com`, use `com.googleusercontent.apps.123-abc`).
3. Neon Auth must have Google OAuth configured (same as for the web app). The app sends the Google ID token to Neon Auth’s `sign-in/social` endpoint.

## Getting Started (Flutter)

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

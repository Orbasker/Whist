# whist_flutter

Whist game scoring – Flutter app (same auth and API as the Angular web app).

## Auth configuration

Auth base URL is defined in **`lib/config/auth_config.dart`** (`AuthConfig.authBaseUrl`). It defaults to the same Neon Auth URL as the Angular app. **This value must match** Angular’s `environment.authUrl` (in `angular-web/src/environments/`) so both clients talk to the same Neon Auth backend.

To override at run/build time:

- `flutter run --dart-define=AUTH_BASE_URL=https://...`
- `flutter build apk --dart-define=AUTH_BASE_URL=...`

## Getting Started

### Google Sign-In (optional)

Login with Google uses the **same Neon Auth backend** as the web app. The Flutter app uses **native Google Sign-In** and sends the Google idToken to Neon Auth’s `sign-in/social` endpoint (no redirect OAuth). The web app uses redirect-based OAuth; both produce the same session/JWT from the same backend.

**Setup:**

1. **Google Cloud Console**: In the same project used for Neon Auth (or your web app), create an **iOS** OAuth 2.0 Client ID (Credentials → Create credentials → OAuth client ID → iOS). Note the **iOS client ID** (e.g. `123-xxx.apps.googleusercontent.com`).
2. **iOS**: In `ios/Runner/Info.plist`, replace `com.googleusercontent.apps.YOUR-IOS-CLIENT-ID-REVERSED` in `CFBundleURLSchemes` with your **reversed** iOS client ID (e.g. if the client ID is `123-abc.apps.googleusercontent.com`, use `com.googleusercontent.apps.123-abc`).
3. **Neon Auth**: Google OAuth must be configured in the Neon Auth dashboard (same as for the web app).

**Full details** (Android when added, auth_config, optional deep links): see **[docs/flutter-google-signin-neon-auth.md](../docs/flutter-google-signin-neon-auth.md)**.

## Getting Started (Flutter)

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

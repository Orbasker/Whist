# Flutter Google Sign-In and Neon Auth

This document describes how the Flutter app’s Google Sign-In integrates with the same Neon Auth backend as the Angular web app, and how to configure iOS/Android.

## Same backend as web

- **Flutter** and **Angular web** use the **same Neon Auth backend**.
- Flutter’s auth base URL is set in `flutter_mobile/lib/config/auth_config.dart` (`AuthConfig.authBaseUrl`). It **must match** Angular’s `environment.authUrl` (e.g. in `angular-web/src/environments/`). The default in the repo is the same Neon Auth URL so both clients talk to one backend.
- Sessions and JWTs issued by Neon Auth work for both: the backend validates the same JWTs whether the user signed in from web or Flutter.

## Flow difference: web vs Flutter

| | **Web (Angular)** | **Flutter (mobile)** |
|---|---|---|
| **Google sign-in** | Redirect-based OAuth | Native Google Sign-In + idToken |
| **Flow** | `authClient.signIn.social({ provider: 'google', callbackURL })` → redirect to Google → redirect back to app with `neon_auth_session_verifier` (or similar) → Neon Auth creates session | `GoogleSignIn` (native) → get `idToken` → `POST {authBaseUrl}/sign-in/social` with `provider: 'google'` and `idToken: { token }` → Neon Auth creates session |
| **Callback** | Browser redirect to `callbackURL` (e.g. `/login`); Angular may strip `neon_auth_session_verifier` from URL | No redirect; response from `sign-in/social` contains session/token; app stores JWT in secure storage |

Both flows call the **same Neon Auth API** (`sign-in/social`) and produce the same kind of session/JWT. The backend does not distinguish whether the request came from web or Flutter.

## iOS configuration (Google Sign-In)

1. **Google Cloud Console**  
   In the same project used for Neon Auth (or the web app), create an **iOS** OAuth 2.0 Client ID (Credentials → Create credentials → OAuth client ID → iOS). Note the **iOS client ID** (e.g. `123-xxx.apps.googleusercontent.com`).

2. **Info.plist**  
   In `flutter_mobile/ios/Runner/Info.plist`, set the URL scheme for Google Sign-In:
   - Replace `com.googleusercontent.apps.YOUR-IOS-CLIENT-ID-REVERSED` in `CFBundleURLSchemes` with your **reversed** iOS client ID.
   - Example: if the client ID is `123456789-abc.apps.googleusercontent.com`, the URL scheme is `com.googleusercontent.apps.123456789-abc` (i.e. `com.googleusercontent.apps.` plus the part before `.apps.googleusercontent.com`).

   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleTypeRole</key>
       <string>Editor</string>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>com.googleusercontent.apps.YOUR-REVERSED-CLIENT-ID</string>
       </array>
     </dict>
   </array>
   ```

3. **Neon Auth**  
   Ensure Google OAuth is configured in the Neon Auth dashboard for the same project (same as for the web app).

## Android configuration (Google Sign-In)

When you add an Android target to the Flutter app:

1. **Google Cloud Console**  
   Create an **Android** OAuth 2.0 Client ID (package name + SHA-1 of your signing key). Optionally use the same **Web** client ID as **server client ID** so that the Android app can obtain an idToken for the backend.

2. **Flutter**  
   If you need to pass a server client ID (e.g. for idToken), configure `GoogleSignIn` with `serverClientId` (your Web OAuth client ID from the same Google project). Example in `auth_service.dart`:
   ```dart
   GoogleSignIn(
     scopes: ['email', 'profile'],
     serverClientId: 'YOUR-WEB-CLIENT-ID.apps.googleusercontent.com', // optional, for idToken
   );
   ```

3. **Neon Auth**  
   Same as iOS: Google OAuth must be configured in Neon Auth (same as web).

The Flutter app does **not** use a redirect callback on Android; it uses the same native Sign-In + idToken → `sign-in/social` flow, so no Android deep link is required for OAuth callback.

## Auth config (auth_config.dart)

- **File:** `flutter_mobile/lib/config/auth_config.dart`
- **Purpose:** Defines the Neon Auth base URL used for sign-in, sign-up, get-session, and sign-out.
- **Override:**  
  `flutter run --dart-define=AUTH_BASE_URL=https://...`  
  `flutter build apk --dart-define=AUTH_BASE_URL=...`  
  (and equivalent for iOS.)

Keep this URL in sync with Angular’s `authUrl` so web and Flutter share the same backend.

## Optional: deep link for OAuth callback

- **Current Flutter flow:** Native Google Sign-In → idToken → POST to `sign-in/social`. There is **no browser redirect** and **no OAuth callback URL** to the app. Session is returned in the HTTP response; no deep link is used or required.
- **Web flow:** Uses redirect OAuth; after Google sign-in the user is redirected back to the site (e.g. `/login`). The Angular app may strip `neon_auth_session_verifier` from the URL (see `angular-web/src/app/features/home/home.component.ts`).
- **If you later want redirect-based OAuth on Flutter** (e.g. in-app WebView or browser opening Neon Auth’s social sign-in URL), you would then:
  - Register a custom URL scheme or App Link (e.g. `yourapp://auth/callback`).
  - Configure Neon Auth (or proxy) to redirect to that URL with the same query params used on web (e.g. `neon_auth_session_verifier`).
  - Handle that URL in the Flutter app (e.g. with `uni_links` or `app_links`) and exchange the verifier for a session if the API supports it.

For the **current** implementation, **no deep link is required** for Flutter Google Sign-In; the native idToken flow is sufficient and works against the same Neon Auth backend as the web.

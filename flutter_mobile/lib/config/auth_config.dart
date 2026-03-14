/// Auth endpoint configuration for the Flutter app.
///
/// This value **must match** the Neon Auth URL used by the Angular web app
/// (Angular `environment.authUrl`). Both clients talk to the same Neon
/// Auth backend; if they differ, sessions and tokens will not be shared.
///
/// Override at build/run time with:
///   flutter run --dart-define=AUTH_BASE_URL=https://...
///   flutter build apk --dart-define=AUTH_BASE_URL=...
///
/// Default is the same Neon Auth URL as in Angular's environment files.
class AuthConfig {
  AuthConfig._();

  /// Neon Auth base URL (e.g. https://ep-xxx.neonauth.../neondb/auth).
  /// Must match Angular's `environment.authUrl`.
  static const String authBaseUrl = String.fromEnvironment(
    'AUTH_BASE_URL',
    defaultValue:
        'https://ep-shiny-voice-agz9vcbc.neonauth.c-2.eu-central-1.aws.neon.tech/neondb/auth',
  );

  /// Web app origin used as the OAuth callbackURL. Must be a trusted origin
  /// registered in Neon Auth. Override with:
  ///   flutter run --dart-define=WEB_APP_ORIGIN=https://your-app.com
  static const String webAppOrigin = String.fromEnvironment(
    'WEB_APP_ORIGIN',
    defaultValue: 'http://localhost:4200',
  );
}

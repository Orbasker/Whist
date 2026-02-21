/// Runtime configuration for Whist Flutter app.
///
/// Uses compile-time [String.fromEnvironment] so values can be set via:
///   flutter run --dart-define=API_URL=https://... --dart-define=AUTH_URL=https://...
///   flutter build apk --dart-define=API_URL=... --dart-define=AUTH_URL=...
///
/// Defaults match the same backend as the Angular app (Whist API).
class AppConfig {
  AppConfig._();

  /// Whist API base URL (e.g. http://localhost:8000/api/v1).
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:8000/api/v1',
  );

  /// Neon Auth URL for authentication (same as Angular).
  /// From Neon Dashboard → Users → Configuration → Auth URL.
  static const String authUrl = String.fromEnvironment(
    'AUTH_URL',
    defaultValue:
        'https://ep-shiny-voice-agz9vcbc.neonauth.c-2.eu-central-1.aws.neon.tech/neondb/auth',
  );

  /// Whether the app is built in production mode.
  static const bool isProduction = bool.fromEnvironment(
    'dart.vm.product',
    defaultValue: false,
  );
}

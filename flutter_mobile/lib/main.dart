import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'config/auth_config.dart';
import 'l10n/app_localizations.dart';
import 'providers/locale_provider.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'services/game_service.dart';
import 'services/realtime_types.dart';
import 'services/websocket_realtime_service.dart';

const _apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:8000/api/v1',
);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final localeProvider = await LocaleProvider.create();
  runApp(WhistApp(localeProvider: localeProvider));
}

class WhistApp extends StatelessWidget {
  const WhistApp({super.key, required this.localeProvider});

  final LocaleProvider localeProvider;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<LocaleProvider>.value(value: localeProvider),
        ChangeNotifierProvider<AuthService>(
          create: (_) {
            final auth = AuthService(authBaseUrl: AuthConfig.authBaseUrl);
            auth.loadSession();
            return auth;
          },
        ),
        ProxyProvider<AuthService, ApiService>(
          update: (_, auth, __) => ApiService(
            baseUrl: _apiBaseUrl,
            getToken: auth.getToken,
          ),
        ),
        Provider<RealtimeService>(
          create: (_) => WebSocketRealtimeService(apiBaseUrl: _apiBaseUrl),
        ),
        ChangeNotifierProxyProvider2<ApiService, RealtimeService, GameService>(
          create: (_) => GameService(
            ApiService(baseUrl: _apiBaseUrl, getToken: () async => null),
            WebSocketRealtimeService(apiBaseUrl: _apiBaseUrl),
          ),
          update: (_, api, realtime, prev) {
            if (prev != null) return prev..updateDependencies(api, realtime);
            return GameService(api, realtime);
          },
        ),
      ],
      child: Consumer<LocaleProvider>(
        builder: (context, localeProvider, _) {
          return MaterialApp(
            title: 'Whist',
            theme: ThemeData.from(
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.amber,
                brightness: Brightness.dark,
              ),
              useMaterial3: true,
            ),
            locale: localeProvider.locale,
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            home: const AuthGate(),
          );
        },
      ),
    );
  }
}

/// Shows AuthScreen when not authenticated, HomeScreen when authenticated.
/// Loads session on first build.
class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  @override
  Widget build(BuildContext context) {
    return Consumer<AuthService>(
      builder: (context, auth, _) {
        if (!auth.initialLoadDone) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (!auth.isAuthenticated) {
          return const AuthScreen();
        }
        return const HomeScreen();
      },
    );
  }
}

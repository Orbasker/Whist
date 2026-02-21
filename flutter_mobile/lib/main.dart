import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/auth_screen.dart';
import 'screens/game_screen.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'services/game_service.dart';

void main() {
  runApp(const WhistApp());
}

class WhistApp extends StatelessWidget {
  const WhistApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Whist',
      theme: ThemeData.from(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.amber,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthService>(
            create: (_) {
              final auth = AuthService(
                authBaseUrl: const String.fromEnvironment(
                  'AUTH_BASE_URL',
                  defaultValue:
                      'https://ep-shiny-voice-agz9vcbc.neonauth.c-2.eu-central-1.aws.neon.tech/neondb/auth',
                ),
              );
              auth.loadSession();
              return auth;
            },
          ),
          ProxyProvider<AuthService, ApiService>(
            update: (_, auth, __) => ApiService(
              baseUrl: const String.fromEnvironment(
                'API_BASE_URL',
                defaultValue: 'http://localhost:8000/api/v1',
              ),
              getToken: auth.getToken,
            ),
          ),
          ProxyProvider<ApiService, GameService>(
            update: (_, api, __) => GameService(api),
          ),
        ],
        child: const AuthGate(),
      ),
    );
  }
}

/// Shows AuthScreen when not authenticated, GameScreen when authenticated.
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
        return const GameScreen();
      },
    );
  }
}

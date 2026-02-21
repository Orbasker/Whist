import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/game_screen.dart';
import 'services/api_service.dart';
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
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.amber, brightness: Brightness.dark),
        useMaterial3: true,
      ),
      home: MultiProvider(
        providers: [
          Provider<ApiService>(
            create: (_) => ApiService(
              baseUrl: const String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:8000/api/v1'),
              authToken: null, // Set from auth when implemented
            ),
          ),
          ChangeNotifierProxyProvider<ApiService, GameService>(
            create: (context) => GameService(context.read<ApiService>()),
            update: (_, api, previous) => previous!,
          ),
        ],
        child: const GameScreen(),
      ),
    );
  }
}

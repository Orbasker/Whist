import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/game_screen.dart';
import 'services/api_service.dart';
import 'services/game_service.dart';
import 'services/realtime_types.dart';
import 'services/websocket_realtime_service.dart';

const _apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:8000/api/v1',
);

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
              baseUrl: _apiBaseUrl,
              authToken: null, // Set from auth when implemented
            ),
          ),
          Provider<RealtimeService>(
            create: (_) => WebSocketRealtimeService(apiBaseUrl: _apiBaseUrl),
          ),
          ProxyProvider2<ApiService, RealtimeService, GameService>(
            update: (_, api, realtime, __) => GameService(api, realtime),
          ),
        ],
        child: const GameScreen(),
      ),
    );
  }
}

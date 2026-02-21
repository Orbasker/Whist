import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'l10n/app_localizations.dart';
import 'providers/locale_provider.dart';
import 'screens/game_screen.dart';
import 'services/api_service.dart';
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
        Provider<ApiService>(
          create: (_) => ApiService(
            baseUrl: _apiBaseUrl,
            authToken: null,
          ),
        ),
        Provider<RealtimeService>(
          create: (_) => WebSocketRealtimeService(apiBaseUrl: _apiBaseUrl),
        ),
        ProxyProvider2<ApiService, RealtimeService, GameService>(
          update: (_, api, realtime, __) => GameService(api, realtime),
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
            home: const GameScreen(),
          );
        },
      ),
    );
  }
}

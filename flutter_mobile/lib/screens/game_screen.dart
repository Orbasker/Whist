import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../providers/locale_provider.dart';
import '../services/auth_service.dart';
import '../services/game_service.dart';
import '../widgets/round_history_screen.dart';
import '../widgets/score_table_sheet.dart';

/// Game screen: shows scoreboard icon -> score table sheet; round history button -> round history screen; delete game (owner) from score table.
/// When [gameId] is provided (e.g. from Home), loads that game. Otherwise tries current game or first from list.
class GameScreen extends StatefulWidget {
  const GameScreen({super.key, this.gameId});

  final String? gameId;

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadGame();
    WidgetsBinding.instance.addPostFrameCallback((_) => _setCurrentUser());
  }

  void _setCurrentUser() {
    final auth = context.read<AuthService>();
    context.read<GameService>().setCurrentUserId(auth.user?.id);
  }

  Future<void> _loadGame() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final gameService = context.read<GameService>();
      String? id = widget.gameId;
      if (id == null && gameService.gameState != null) {
        id = gameService.gameState!.id;
      }
      if (id == null) {
        final games = await gameService.listGames();
        if (games.isNotEmpty) id = games.first.id;
      }
      if (id != null) await gameService.loadGame(id);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<GameService>(
      builder: (context, gameService, _) {
        final gameState = gameService.gameState;

        if (_loading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final l10n = AppLocalizations.of(context)!;
        if (_error != null) {
          return Scaffold(
            appBar: AppBar(title: Text(l10n.appTitle), actions: [_buildLanguageMenu(context)]),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_error!, textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () {
                        setState(() {
                          _error = null;
                          _loading = true;
                        });
                        _loadGame();
                      },
                      child: Text(l10n.retry),
                    ),
                  ],
                ),
              ),
            ),
          );
        }
        if (gameState == null) {
          return Scaffold(
            appBar: AppBar(
              leading: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.of(context).pop(),
              ),
              title: Text(l10n.appTitle),
              actions: [_buildLanguageMenu(context)],
            ),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(l10n.noGameLoaded, textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Back to Home'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => Navigator.of(context).pop(),
            ),
            title: Text(l10n.appBarTitleRounds(gameState.currentRound - 1)),
            actions: [
              _RealtimeIndicator(isConnected: gameService.isRealtimeConnected),
              IconButton(
                icon: const Icon(Icons.history),
                tooltip: l10n.roundHistoryTooltip,
                onPressed: () => _openRoundHistory(context, gameService),
              ),
              IconButton(
                icon: const Icon(Icons.emoji_events_outlined),
                tooltip: l10n.scoreTableTooltip,
                onPressed: () => _openScoreTableSheet(context, gameService),
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.account_circle_outlined),
                tooltip: 'Log out',
                onSelected: (value) {
                  if (value == 'logout') _logout(context);
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'logout',
                    child: Text('Log out'),
                  ),
                ],
              ),
              _buildLanguageMenu(context),
            ],
          ),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (gameService.realtimeError != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      gameService.realtimeError!,
                      style: TextStyle(color: Theme.of(context).colorScheme.error),
                      textAlign: TextAlign.center,
                    ),
                  ),
                Text('${l10n.gameLabel}: ${gameState.name ?? gameState.id}'),
                Text('${l10n.playersLabel}: ${gameState.players.join(", ")}'),
                const SizedBox(height: 16),
                Text('${l10n.currentScoresLabel}: ${gameState.scores.join(", ")}'),
              ],
            ),
          ),
        );
      },
    );
  }

  void _openScoreTableSheet(BuildContext context, GameService gameService) {
    final gameState = gameService.gameState!;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => ScoreTableSheet(
        gameState: gameState,
        isGameOwner: gameService.isGameOwner,
        onDismiss: () => Navigator.of(context).pop(),
        onDeleteRequested: () async {
          await gameService.deleteGame(gameState.id);
          if (!context.mounted) return;
          Navigator.of(context).pop(); // close sheet
          gameService.clearGame();
          if (!context.mounted) return;
          Navigator.of(context).pop(); // back to Home
        },
      ),
    );
  }

  Future<void> _logout(BuildContext context) async {
    context.read<GameService>().clearGame();
    await context.read<AuthService>().signOut();
    // AuthGate rebuilds and shows AuthScreen; no setState needed.
  }

  void _openRoundHistory(BuildContext context, GameService gameService) {
    final gameState = gameService.gameState!;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (context) => RoundHistoryScreen(
          rounds: gameService.rounds,
          players: gameState.players,
          currentPlayerIndex: gameService.currentPlayerIndex,
          onClose: () => Navigator.of(context).pop(),
        ),
      ),
    );
  }

  Widget _buildLanguageMenu(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final localeProvider = context.watch<LocaleProvider>();
    return PopupMenuButton<AppLocale>(
      tooltip: l10n.language,
      icon: const Icon(Icons.language),
      onSelected: (locale) => localeProvider.setLocale(locale),
      itemBuilder: (context) => [
        PopupMenuItem(
          value: AppLocale.he,
          child: Row(
            children: [
              if (localeProvider.appLocale == AppLocale.he)
                const Icon(Icons.check, size: 20),
              if (localeProvider.appLocale == AppLocale.he) const SizedBox(width: 8),
              Text(l10n.hebrew),
            ],
          ),
        ),
        PopupMenuItem(
          value: AppLocale.en,
          child: Row(
            children: [
              if (localeProvider.appLocale == AppLocale.en)
                const Icon(Icons.check, size: 20),
              if (localeProvider.appLocale == AppLocale.en) const SizedBox(width: 8),
              Text(l10n.english),
            ],
          ),
        ),
      ],
    );
  }
}

class _RealtimeIndicator extends StatelessWidget {
  const _RealtimeIndicator({required this.isConnected});

  final bool isConnected;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Tooltip(
          message: isConnected ? 'Live updates connected' : 'Realtime disconnected',
          child: Icon(
            isConnected ? Icons.circle : Icons.circle_outlined,
            size: 10,
            color: isConnected
                ? Theme.of(context).colorScheme.primary
                : Theme.of(context).colorScheme.outline,
          ),
        ),
      ),
    );
  }
}

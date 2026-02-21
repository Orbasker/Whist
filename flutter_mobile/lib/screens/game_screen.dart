import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../providers/locale_provider.dart';
import '../services/api_service.dart';
import '../services/game_service.dart';
import '../widgets/round_history_screen.dart';
import '../widgets/score_table_sheet.dart';

/// Game screen: shows scoreboard icon -> score table sheet; round history button -> round history screen; delete game (owner) from score table.
class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

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
  }

  Future<void> _loadGame() async {
    // In a full app, gameId would come from route args or storage
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final gameService = context.read<GameService>();
      // Demo: try loading first game from list, or use a stored game id
      final games = await gameService.gameState != null
          ? null
          : (await context.read<ApiService>().listGames());
      String? id;
      if (gameService.gameState != null) {
        id = gameService.gameState!.id;
      } else if (games != null && games.isNotEmpty) {
        id = games.first.id;
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
            appBar: AppBar(title: Text(l10n.appTitle), actions: [_buildLanguageMenu(context)]),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(l10n.noGameLoaded, textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton(
                    onPressed: () {
                      setState(() => _loading = true);
                      _loadGame();
                    },
                    child: Text(l10n.refresh),
                  ),
                  ],
                ),
              ),
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Text(l10n.appBarTitleRounds(gameState.currentRound - 1)),
            actions: [
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
              _buildLanguageMenu(context),
            ],
          ),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
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
          setState(() => gameService.clearGame());
          if (!context.mounted) return;
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const GameScreen()),
          );
        },
      ),
    );
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

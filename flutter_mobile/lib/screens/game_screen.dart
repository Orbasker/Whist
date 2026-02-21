import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

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
        if (_error != null) {
          return Scaffold(
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
                      child: const Text('Retry'),
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
            ),
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('No game loaded. Create or open a game from Home.'),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Back to Home'),
                  ),
                ],
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
            title: Text('Score board · ${gameState.currentRound - 1} rounds'),
            actions: [
              IconButton(
                icon: const Icon(Icons.history),
                tooltip: 'Round history',
                onPressed: () => _openRoundHistory(context, gameService),
              ),
              IconButton(
                icon: const Icon(Icons.emoji_events_outlined),
                tooltip: 'Score table',
                onPressed: () => _openScoreTableSheet(context, gameService),
              ),
            ],
          ),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Game: ${gameState.name ?? gameState.id}'),
                Text('Players: ${gameState.players.join(", ")}'),
                const SizedBox(height: 16),
                Text('Current scores: ${gameState.scores.join(", ")}'),
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
}

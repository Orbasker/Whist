import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/api_service.dart';
import '../services/game_service.dart';
import '../widgets/bidding_phase_content.dart';
import '../widgets/round_history_screen.dart';
import '../widgets/score_table_sheet.dart';

/// Game screen: bidding phase (players, live bids, trump, submit) or placeholder for tricks; score table and round history.
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
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('No game loaded. Create or join a game on the web app.'),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () {
                      setState(() => _loading = true);
                      _loadGame();
                    },
                    child: const Text('Refresh'),
                  ),
                ],
              ),
            ),
          );
        }

        final phase = gameService.phase;
        final roundsPlayed = gameState.currentRound - 1;
        final phaseLabel = phase == 'bidding' ? 'Bidding' : 'Tricks';

        return Scaffold(
          appBar: AppBar(
            title: Text('Score board · $roundsPlayed rounds · $phaseLabel'),
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
          body: phase == 'bidding'
              ? BiddingPhaseContent(
                  gameState: gameState,
                  roundsPlayed: roundsPlayed,
                )
              : Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Game: ${gameState.name ?? gameState.id}'),
                      Text('Players: ${gameState.players.join(', ')}'),
                      const SizedBox(height: 16),
                      Text('Current scores: ${gameState.scores.join(', ')}'),
                      const SizedBox(height: 8),
                      Text('Tricks phase – coming next', style: Theme.of(context).textTheme.bodySmall),
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
}

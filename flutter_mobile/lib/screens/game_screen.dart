import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_strings.dart';
import '../models/game_state.dart';
import '../services/api_service.dart';
import '../services/game_service.dart';
import '../widgets/round_history_screen.dart';
import '../widgets/score_table_sheet.dart';
import '../widgets/tricks_phase_content.dart';

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

        final phaseLabel = gameService.phase == GamePhase.tricks
            ? AppStrings.gameTricks
            : AppStrings.gameBidding;

        return Scaffold(
          appBar: AppBar(
            title: Text(
              '${AppStrings.scoreTableTitle} · ${gameState.currentRound - 1} rounds · $phaseLabel',
            ),
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
          body: gameService.phase == GamePhase.tricks
              ? TricksPhaseContent(
                  gameState: gameState,
                  onOpenScoreTable: () => _openScoreTableSheet(context, gameService),
                  onOpenRoundHistory: () => _openRoundHistory(context, gameService),
                  onRoundComplete: () => setState(() {}),
                )
              : _BiddingPlaceholder(
                  gameState: gameState,
                  onBidsSubmitted: () => setState(() {}),
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

/// Placeholder when in bidding phase: submit bids to transition to tricks.
class _BiddingPlaceholder extends StatefulWidget {
  const _BiddingPlaceholder({
    required this.gameState,
    required this.onBidsSubmitted,
  });

  final GameState gameState;
  final VoidCallback onBidsSubmitted;

  @override
  State<_BiddingPlaceholder> createState() => _BiddingPlaceholderState();
}

class _BiddingPlaceholderState extends State<_BiddingPlaceholder> {
  final List<int> _bids = [0, 0, 0, 0];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final gameService = context.read<GameService>();
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Game: ${widget.gameState.name ?? widget.gameState.id}',
            style: theme.textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Players: ${widget.gameState.players.join(", ")}',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          Text(
            'Current scores: ${widget.gameState.scores.join(", ")}',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 24),
          const Text('Bidding phase – enter bids to continue to tricks'),
          const SizedBox(height: 12),
          ...List.generate(4, (i) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  SizedBox(
                    width: 120,
                    child: Text(
                      widget.gameState.players[i],
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  SizedBox(
                    width: 60,
                    child: TextField(
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Bid',
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (s) {
                        final v = int.tryParse(s);
                        if (v != null && v >= 0 && v <= 13) {
                          setState(() => _bids[i] = v);
                        }
                      },
                    ),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () async {
              try {
                await gameService.submitBids(widget.gameState.id, _bids);
                if (context.mounted) widget.onBidsSubmitted();
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed to submit bids: $e')),
                  );
                }
              }
            },
            child: const Text('Submit bids → Tricks phase'),
          ),
        ],
      ),
    );
  }
}

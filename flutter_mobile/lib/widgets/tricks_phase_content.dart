import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_strings.dart';
import '../models/game_state.dart';
import '../models/round_summary_results.dart';
import '../services/game_service.dart';
import 'round_summary_dialog.dart';
import 'tricks_input_grid.dart';

/// Tricks phase UI: total tricks, per-player trick input, finish round.
/// Matches Angular tricks-phase behaviour (no realtime lock in Flutter; single user can edit all).
class TricksPhaseContent extends StatefulWidget {
  const TricksPhaseContent({
    super.key,
    required this.gameState,
    required this.onOpenScoreTable,
    required this.onOpenRoundHistory,
    required this.onRoundComplete,
  });

  final GameState gameState;
  final VoidCallback onOpenScoreTable;
  final VoidCallback onOpenRoundHistory;
  final VoidCallback onRoundComplete;

  @override
  State<TricksPhaseContent> createState() => _TricksPhaseContentState();
}

class _TricksPhaseContentState extends State<TricksPhaseContent> {
  late List<int> _tricks;
  static const int _totalRequired = 13;

  @override
  void initState() {
    super.initState();
    final n = widget.gameState.players.length;
    _tricks = List.filled(n, 0);
  }

  int get _totalTricks => _tricks.fold<int>(0, (a, b) => a + b);

  void _onTrickChange(int playerIndex, int value) {
    setState(() {
      _tricks[playerIndex] = value;
    });
  }

  Future<void> _onSubmit() async {
    if (_totalTricks != _totalRequired) return;
    final gameService = context.read<GameService>();
    final gameId = widget.gameState.id;
    try {
      final round = await gameService.submitTricks(gameId, _tricks);
      if (!mounted) return;
      widget.onRoundComplete();
      if (round != null &&
          round.bids.length >= 4 &&
          round.tricks.length >= 4 &&
          round.scores.length >= 4) {
        final players = widget.gameState.players;
        final newScores =
            gameService.gameState?.scores ?? widget.gameState.scores;
        final results = RoundSummaryResults(
          players: players,
          bids: round.bids,
          tricks: round.tricks,
          roundScores: round.scores,
          newTotalScores: newScores.length >= 4 ? newScores : round.scores,
        );
        if (!mounted) return;
        await showDialog<void>(
          context: context,
          barrierDismissible: false,
          builder: (context) => RoundSummaryDialog(
            results: results,
            onContinue: () => Navigator.of(context).pop(),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Failed to submit tricks')));
      debugPrint('submitTricks failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final gameService = context.watch<GameService>();
    final bids = gameService.currentBids ??
        List.filled(widget.gameState.players.length, 0);
    final roundsPlayed = widget.gameState.currentRound - 1;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            AppStrings.tricksPhaseQuestion,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: theme.colorScheme.primary.withValues(alpha: 0.3),
              ),
            ),
            child: Center(
              child: Text(
                '${AppStrings.tricksPhaseTotalTricks} $_totalTricks',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: widget.onOpenScoreTable,
                  icon: const Icon(Icons.emoji_events_outlined, size: 20),
                  label: Text(
                    AppStrings.roundsPlayed.replaceFirst('%s', '$roundsPlayed'),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: widget.onOpenRoundHistory,
                icon: const Icon(Icons.history),
                tooltip: 'Round history',
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...List.generate(widget.gameState.players.length, (i) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _PlayerTrickCard(
                playerName: widget.gameState.players[i],
                bid: i < bids.length ? bids[i] : 0,
                selectedTrick: _tricks[i],
                onTrickSelected: (v) => _onTrickChange(i, v),
                isCurrentPlayer: gameService.currentPlayerIndex == i,
                isOwner: gameService.isGameOwner &&
                    widget.gameState.playerUserIds != null &&
                    i < widget.gameState.playerUserIds!.length &&
                    widget.gameState.ownerId != null &&
                    widget.gameState.playerUserIds![i] ==
                        widget.gameState.ownerId,
              ),
            );
          }),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: _totalTricks == _totalRequired ? _onSubmit : null,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: Text(
              _totalTricks == _totalRequired
                  ? AppStrings.tricksPhaseFinishRound
                  : _validationMessage(),
            ),
          ),
        ],
      ),
    );
  }

  String _validationMessage() {
    if (_totalTricks < _totalRequired) {
      return AppStrings.tricksPhaseValidationMissing(
        _totalRequired - _totalTricks,
      );
    }
    if (_totalTricks > _totalRequired) {
      return AppStrings.tricksPhaseValidationExtra(
        _totalTricks - _totalRequired,
      );
    }
    return AppStrings.tricksPhaseFinishRound;
  }
}

class _PlayerTrickCard extends StatelessWidget {
  const _PlayerTrickCard({
    required this.playerName,
    required this.bid,
    required this.selectedTrick,
    required this.onTrickSelected,
    this.isCurrentPlayer = false,
    this.isOwner = false,
  });

  final String playerName;
  final int bid;
  final int selectedTrick;
  final ValueChanged<int> onTrickSelected;
  final bool isCurrentPlayer;
  final bool isOwner;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Text(
                  '$selectedTrick ${AppStrings.tricksPhaseTricks}',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  alignment: WrapAlignment.end,
                  children: [
                    Text(
                      playerName,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (isCurrentPlayer)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          AppStrings.you,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.onPrimaryContainer,
                          ),
                        ),
                      ),
                    if (isOwner)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'Manager',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    Text(
                      '${AppStrings.tricksPhaseBid}: $bid',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            TricksInputGrid(
              selectedTrick: selectedTrick,
              onTrickSelected: onTrickSelected,
              enabled: true,
            ),
          ],
        ),
      ),
    );
  }
}

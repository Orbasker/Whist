import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_strings.dart';
import '../models/game_state.dart';
import '../services/game_service.dart';
import '../theme/app_colors.dart';
import 'bid_input_grid.dart';
import 'round_history_screen.dart';
import 'score_table_sheet.dart';
import 'trump_selector.dart';

/// Bidding phase UI: players, live bid selections (from realtime), trump selection, submit bids.
/// Matches Angular BiddingPhaseComponent behaviour.
class BiddingPhaseContent extends StatefulWidget {
  const BiddingPhaseContent({
    super.key,
    required this.gameState,
    required this.roundsPlayed,
  });

  final GameState gameState;
  final int roundsPlayed;

  @override
  State<BiddingPhaseContent> createState() => _BiddingPhaseContentState();
}

class _BiddingPhaseContentState extends State<BiddingPhaseContent> {
  /// Local bids per player index (merged with live from realtime for display).
  late List<int> _bids;

  @override
  void initState() {
    super.initState();
    _bids = List.filled(widget.gameState.players.length.clamp(0, 4), 0);
  }

  @override
  void didUpdateWidget(BiddingPhaseContent oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.gameState.players.length != oldWidget.gameState.players.length) {
      _bids = List.filled(widget.gameState.players.length.clamp(0, 4), 0);
    }
  }

  int _getBidForPlayer(GameService gs, int playerIndex) {
    if (gs.liveBidSelections.containsKey(playerIndex)) {
      final bid = gs.liveBidSelections[playerIndex]!;
      if (playerIndex < _bids.length) _bids[playerIndex] = bid;
      return bid;
    }
    return playerIndex < _bids.length ? _bids[playerIndex] : 0;
  }

  int _totalBids(GameService gs) {
    final n = widget.gameState.players.length;
    var total = 0;
    for (var i = 0; i < n && i < 4; i++) {
      total += _getBidForPlayer(gs, i);
    }
    return total;
  }

  bool _canEditBid(GameService gs, int playerIndex) {
    if (gs.isGameOwner) return !gs.lockedBids.contains(playerIndex);
    if (gs.currentPlayerIndex == null) return false;
    return playerIndex == gs.currentPlayerIndex &&
        !gs.lockedBids.contains(playerIndex);
  }

  bool _canLockBid(GameService gs, int playerIndex) {
    if (gs.lockedBids.contains(playerIndex)) return false;
    if (gs.isGameOwner) return true;
    return playerIndex == gs.currentPlayerIndex &&
        gs.currentPlayerIndex != null;
  }

  bool _canSubmit(GameService gs) {
    final n = widget.gameState.players.length;
    for (var i = 0; i < n && i < _bids.length; i++) {
      final b = _getBidForPlayer(gs, i);
      if (b < 0 || b > 13) return false;
    }
    return _totalBids(gs) != 13;
  }

  String _statusMessage(GameService gs) {
    final total = _totalBids(gs);
    if (total == 13) return '❌ ${AppStrings.biddingPhaseCannotBid13}';
    final diff = (13 - total).abs();
    if (total < 13) return AppStrings.biddingPhaseUnderMode(diff);
    return AppStrings.biddingPhaseOverMode(diff);
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<GameService>(
      builder: (context, gs, _) {
        final totalBids = _totalBids(gs);
        final canSubmit = _canSubmit(gs);

        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Title & subtitle
              Text(
                AppStrings.biddingPhaseTitle,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                AppStrings.biddingPhaseSubtitle,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 20),

              // Trump
              Text(
                AppStrings.biddingPhaseTrump,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              TrumpSelector(
                selectedTrump: gs.liveTrumpSelection,
                onTrumpSelect: gs.sendTrumpSelection,
              ),
              const SizedBox(height: 20),

              // Total bids card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            AppStrings.biddingPhaseTotalBids,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurfaceVariant,
                                ),
                          ),
                          Text(
                            '$totalBids',
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: totalBids > 13 ? 1 : totalBids / 13,
                          minHeight: 10,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _statusMessage(gs),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: totalBids == 13
                                  ? Theme.of(context).colorScheme.error
                                  : Theme.of(context)
                                      .colorScheme
                                      .onSurfaceVariant,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Score table & round history buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _openScoreTable(context, gs),
                      icon: const Icon(Icons.emoji_events_outlined, size: 20),
                      label: Text(
                        '${AppStrings.roundHistoryTitle} (${widget.roundsPlayed} rounds)',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () => _openRoundHistory(context, gs),
                    tooltip: 'Open rounds list',
                    icon: const Icon(Icons.list),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Per-player cards
              ...List.generate(widget.gameState.players.length, (i) {
                return _PlayerBidCard(
                  playerName: widget.gameState.players[i],
                  playerIndex: i,
                  currentPlayerIndex: gs.currentPlayerIndex,
                  isPlayerOwner: gs.isPlayerOwner(i),
                  isBidLocked: gs.isBidLocked(i),
                  displayBid: _getBidForPlayer(gs, i),
                  hasLiveChoice: gs.liveBidSelections.containsKey(i) &&
                      i != gs.currentPlayerIndex,
                  canEditBid: _canEditBid(gs, i),
                  canLockBid: _canLockBid(gs, i),
                  showCannotEdit: gs.currentPlayerIndex == null && i == 0,
                  onBidChange: (bid) {
                    if (!_canEditBid(gs, i)) return;
                    setState(() {
                      if (i < _bids.length) _bids[i] = bid;
                    });
                    gs.sendBidSelection(i, bid);
                    gs.sendBetChange(i, bid);
                  },
                  onLockBid: () => gs.lockBid(i),
                );
              }),
              const SizedBox(height: 24),

              // Submit
              FilledButton(
                onPressed: canSubmit
                    ? () async {
                        final messenger = ScaffoldMessenger.of(context);
                        final bids = List<int>.filled(
                          widget.gameState.players.length,
                          0,
                        );
                        for (var i = 0;
                            i < bids.length && i < _bids.length;
                            i++) {
                          bids[i] = _getBidForPlayer(gs, i);
                        }
                        try {
                          if (gs.isRealtimeConnected) {
                            gs.sendSubmitBids(
                              bids,
                              trumpSuit: gs.liveTrumpSelection,
                            );
                          } else {
                            await gs.submitBids(
                              gs.gameState!.id,
                              bids,
                              trumpSuit: gs.liveTrumpSelection,
                            );
                          }
                        } catch (_) {
                          if (!mounted) return;
                          messenger.showSnackBar(
                            const SnackBar(
                              content: Text('Failed to submit bids'),
                            ),
                          );
                        }
                      }
                    : null,
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 14),
                  child: Text(AppStrings.biddingPhaseContinue),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _openScoreTable(BuildContext context, GameService gs) {
    final gameState = gs.gameState;
    if (gameState == null) return;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => ScoreTableSheet(
        gameState: gameState,
        isGameOwner: gs.isGameOwner,
        onDismiss: () => Navigator.of(ctx).pop(),
        onDeleteRequested: () async {
          await gs.deleteGame(gameState.id);
          if (!ctx.mounted) return;
          Navigator.of(ctx).pop();
        },
      ),
    );
  }

  void _openRoundHistory(BuildContext context, GameService gs) {
    final gameState = gs.gameState;
    if (gameState == null) return;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (ctx) => RoundHistoryScreen(
          rounds: gs.rounds,
          players: gameState.players,
          currentPlayerIndex: gs.currentPlayerIndex,
          onClose: () => Navigator.of(ctx).pop(),
        ),
      ),
    );
  }
}

class _PlayerBidCard extends StatelessWidget {
  const _PlayerBidCard({
    required this.playerName,
    required this.playerIndex,
    required this.currentPlayerIndex,
    required this.isPlayerOwner,
    required this.isBidLocked,
    required this.displayBid,
    required this.hasLiveChoice,
    required this.canEditBid,
    required this.canLockBid,
    required this.showCannotEdit,
    required this.onBidChange,
    required this.onLockBid,
  });

  final String playerName;
  final int playerIndex;
  final int? currentPlayerIndex;
  final bool isPlayerOwner;
  final bool isBidLocked;
  final int displayBid;
  final bool hasLiveChoice;
  final bool canEditBid;
  final bool canLockBid;
  final bool showCannotEdit;
  final ValueChanged<int> onBidChange;
  final VoidCallback onLockBid;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        playerName,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (currentPlayerIndex == playerIndex)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            AppStrings.biddingPhaseYou,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      if (isPlayerOwner)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            AppStrings.biddingPhaseManager,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                      if (isBidLocked)
                        Text(
                          '🔒 ${AppStrings.biddingPhaseLocked}',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: colorScheme.error,
                          ),
                        ),
                    ],
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '$displayBid ${AppStrings.biddingPhaseTricks}',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: colorScheme.primary,
                      ),
                    ),
                    if (hasLiveChoice)
                      Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: Text(
                          '(${AppStrings.biddingPhaseChoice})',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: colorScheme.primary,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
            if (showCannotEdit)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '⚠️ ${AppStrings.biddingPhaseCannotEdit}',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: colorScheme.primary,
                  ),
                ),
              ),
            const SizedBox(height: 12),
            BidInputGrid(
              selectedBid: displayBid,
              onBidSelect: onBidChange,
              enabled: canEditBid,
            ),
            if (canLockBid)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: onLockBid,
                    style: FilledButton.styleFrom(
                      backgroundColor: colorScheme.tertiary,
                      foregroundColor: colorScheme.onTertiary,
                    ),
                    icon: const Icon(Icons.lock, size: 18),
                    label: Text(
                      currentPlayerIndex == playerIndex
                          ? AppStrings.biddingPhaseLockChoice
                          : AppStrings.biddingPhaseLockPlayerChoice,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

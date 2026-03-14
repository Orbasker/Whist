import 'package:flutter/material.dart';

import '../l10n/app_localizations.dart';
import '../models/round.dart';
import '../theme/app_colors.dart';

/// Round history: table with round, trump, bid/took/change/before/after per player, total row. Aligned with Angular round-history.
class RoundHistoryScreen extends StatelessWidget {
  const RoundHistoryScreen({
    super.key,
    required this.rounds,
    required this.players,
    this.currentPlayerIndex,
    required this.onClose,
  });

  final List<Round> rounds;
  final List<String> players;
  final int? currentPlayerIndex;
  final VoidCallback onClose;

  static const _trumpSymbols = <String, String>{
    'spades': '♠',
    'clubs': '♣',
    'diamonds': '♦',
    'hearts': '♥',
    'no-trump': '✕',
    'null': '✕',
  };

  static String trumpSymbol(String? suit) {
    if (suit == null || suit.isEmpty) return '✕';
    return _trumpSymbols[suit.toLowerCase()] ?? '✕';
  }

  static String formatGainLoss(int score) {
    if (score > 0) return '+$score';
    if (score < 0) return '$score';
    return '0';
  }

  int scoreBefore(int roundIndex, int playerIndex) {
    int sum = 0;
    for (var r = 0; r < roundIndex && r < rounds.length; r++) {
      final s = rounds[r].scores.length > playerIndex
          ? rounds[r].scores[playerIndex]
          : 0;
      sum += s;
    }
    return sum;
  }

  int scoreAfter(int roundIndex, int playerIndex) {
    if (roundIndex >= rounds.length) return 0;
    return scoreBefore(roundIndex, playerIndex) +
        (rounds[roundIndex].scores.length > playerIndex
            ? rounds[roundIndex].scores[playerIndex]
            : 0);
  }

  bool isCurrentPlayer(int pi) =>
      currentPlayerIndex != null && currentPlayerIndex == pi;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.roundHistoryTitle),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: onClose,
          tooltip: l10n.close,
        ),
      ),
      body: rounds.isEmpty
          ? Center(
              child: Text(
                l10n.roundsEmpty,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            )
          : SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: _buildTable(context, theme),
                ),
              ),
            ),
    );
  }

  Widget _buildTable(BuildContext context, ThemeData theme) {
    const cellPad = EdgeInsets.symmetric(horizontal: 8, vertical: 10);
    const headerStyle = TextStyle(fontWeight: FontWeight.w600, fontSize: 12);
    const cellStyle = TextStyle(fontSize: 12);
    const totalStyle = TextStyle(fontWeight: FontWeight.w600, fontSize: 12);
    const numPlayers = 4;
    const colsPerPlayer = 5; // bid, took, change, before, after

    return Table(
      defaultColumnWidth: const IntrinsicColumnWidth(),
      border: TableBorder.all(color: theme.dividerColor),
      children: [
        // Header row 1: Round | Card | then 5 cols per player (player name in first of 5)
        TableRow(
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest,
          ),
          children: [
            _pad(
              Text(AppLocalizations.of(context)!.roundCol, style: headerStyle),
              cellPad,
            ),
            _pad(
              Text(AppLocalizations.of(context)!.cardCol, style: headerStyle),
              cellPad,
            ),
            ...List.generate(numPlayers * colsPerPlayer, (c) {
              final pi = c ~/ colsPerPlayer;
              if (c % colsPerPlayer != 0 || pi >= players.length) {
                return _pad(const SizedBox(), cellPad);
              }
              return _pad(
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(players[pi], style: headerStyle),
                    if (isCurrentPlayer(pi))
                      Padding(
                        padding: const EdgeInsets.only(left: 4),
                        child: Text(
                          '(${AppLocalizations.of(context)!.you})',
                          style: TextStyle(
                            fontSize: 10,
                            color: theme.colorScheme.primary,
                          ),
                        ),
                      ),
                  ],
                ),
                cellPad,
              );
            }),
          ],
        ),
        // Header row 2: empty | empty | Bid Took Change Before After (x4 players = 20 cells)
        TableRow(
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest
                .withValues(alpha: 0.7),
          ),
          children: [
            _pad(const SizedBox(), cellPad),
            _pad(const SizedBox(), cellPad),
            ...List.generate(numPlayers * colsPerPlayer, (c) {
              final l10n = AppLocalizations.of(context)!;
              final labels = [
                l10n.bidCol,
                l10n.tookCol,
                l10n.changeCol,
                l10n.beforeCol,
                l10n.afterCol,
              ];
              return _pad(
                Text(labels[c % colsPerPlayer], style: headerStyle),
                const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              );
            }),
          ],
        ),
        // Data rows: 2 + numPlayers*5 columns
        ...List.generate(rounds.length, (ri) {
          final round = rounds[ri];
          return TableRow(
            children: [
              _pad(Text('${round.roundNumber}', style: cellStyle), cellPad),
              _pad(
                Text(
                  trumpSymbol(round.trumpSuit),
                  style: cellStyle.copyWith(fontSize: 16),
                ),
                cellPad,
              ),
              ...List.generate(numPlayers * colsPerPlayer, (c) {
                final pi = c ~/ colsPerPlayer;
                if (pi >= players.length) {
                  return _pad(const SizedBox(), cellPad);
                }
                final bid = round.bids.length > pi ? round.bids[pi] : 0;
                final took = round.tricks.length > pi ? round.tricks[pi] : 0;
                final score = round.scores.length > pi ? round.scores[pi] : 0;
                final before = scoreBefore(ri, pi);
                final after = scoreAfter(ri, pi);
                final col = c % colsPerPlayer;
                final value = col == 0
                    ? '$bid'
                    : col == 1
                        ? '$took'
                        : col == 2
                            ? formatGainLoss(score)
                            : col == 3
                                ? '$before'
                                : '$after';
                final isChange = col == 2;
                return _pad(
                  Text(
                    value,
                    style: cellStyle.copyWith(
                      fontWeight: isChange ? FontWeight.w600 : null,
                      color: isChange && score > 0
                          ? AppColors.success
                          : isChange && score < 0
                              ? AppColors.destructive
                              : col == 3
                                  ? theme.colorScheme.onSurfaceVariant
                                  : null,
                    ),
                  ),
                  const EdgeInsets.symmetric(horizontal: 4),
                );
              }),
            ],
          );
        }),
        // Footer: Total row (one total per player in last column of each block)
        TableRow(
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            border: Border(
              top: BorderSide(color: theme.dividerColor, width: 2),
            ),
          ),
          children: [
            _pad(
              Text(AppLocalizations.of(context)!.total, style: totalStyle),
              cellPad,
            ),
            _pad(const SizedBox(), cellPad),
            ...List.generate(numPlayers * colsPerPlayer, (c) {
              final pi = c ~/ colsPerPlayer;
              final col = c % colsPerPlayer;
              if (col == colsPerPlayer - 1 && pi < players.length) {
                final total =
                    rounds.isNotEmpty ? scoreAfter(rounds.length - 1, pi) : 0;
                return _pad(Text('$total', style: totalStyle), cellPad);
              }
              return _pad(const SizedBox(), cellPad);
            }),
          ],
        ),
      ],
    );
  }

  Widget _pad(Widget child, EdgeInsets padding) {
    return Padding(padding: padding, child: child);
  }
}

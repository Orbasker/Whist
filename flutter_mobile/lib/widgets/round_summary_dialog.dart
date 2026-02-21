import 'package:flutter/material.dart';

import '../l10n/app_strings.dart';
import '../models/round_summary_results.dart';

/// Modal showing round results (bid, took, round score, new total) and continue to next round.
/// Matches Angular round-summary component.
class RoundSummaryDialog extends StatelessWidget {
  const RoundSummaryDialog({
    super.key,
    required this.results,
    required this.onContinue,
  });

  final RoundSummaryResults results;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text(AppStrings.roundSummaryTitle),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (var i = 0; i < results.players.length; i++) ...[
              if (i > 0) const SizedBox(height: 12),
              _PlayerRow(
                player: results.players[i],
                bid: results.bids[i],
                took: results.tricks[i],
                roundScore: results.roundScores[i],
                newTotal: results.newTotalScores[i],
              ),
            ],
          ],
        ),
      ),
      actions: [
        FilledButton(
          onPressed: () {
            Navigator.of(context).pop();
            onContinue();
          },
          child: const Text(AppStrings.roundSummaryContinueNext),
        ),
      ],
    );
  }
}

class _PlayerRow extends StatelessWidget {
  const _PlayerRow({
    required this.player,
    required this.bid,
    required this.took,
    required this.roundScore,
    required this.newTotal,
  });

  final String player;
  final int bid;
  final int took;
  final int roundScore;
  final int newTotal;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scoreColor = roundScore > 0
        ? theme.colorScheme.primary
        : roundScore < 0
            ? theme.colorScheme.error
            : theme.colorScheme.onSurface;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  player,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  AppStrings.roundSummaryBidTook(bid, took),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${roundScore > 0 ? '+' : ''}$roundScore',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: scoreColor,
                ),
              ),
              Text(
                '${AppStrings.total}: $newTotal',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

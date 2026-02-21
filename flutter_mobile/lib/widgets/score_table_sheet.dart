import 'package:flutter/material.dart';

import '../l10n/app_strings.dart';
import '../models/game_state.dart';
import 'confirm_dialog.dart';

/// Score table view: totals, rounds played, delete game (owner). Aligned with Angular score-table.
class ScoreTableSheet extends StatelessWidget {
  const ScoreTableSheet({
    super.key,
    required this.gameState,
    required this.isGameOwner,
    required this.onDismiss,
    required this.onDeleteRequested,
  });

  final GameState gameState;
  final bool isGameOwner;
  final VoidCallback onDismiss;
  final VoidCallback onDeleteRequested;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        boxShadow: [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildHeader(context),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildCurrentScore(theme),
                    const SizedBox(height: 12),
                    Text(
                      AppStrings.roundsPlayed.replaceFirst('%s', '${gameState.currentRound - 1}'),
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        if (isGameOwner) ...[
                          FilledButton.tonalIcon(
                            onPressed: () => _onDeleteTapped(context),
                            icon: const Icon(Icons.delete_outline),
                            label: const Text(AppStrings.deleteGame),
                            style: FilledButton.styleFrom(
                              backgroundColor: theme.colorScheme.errorContainer,
                              foregroundColor: theme.colorScheme.onErrorContainer,
                            ),
                          ),
                          const SizedBox(width: 12),
                        ],
                        Expanded(
                          child: OutlinedButton(
                            onPressed: onDismiss,
                            child: const Text(AppStrings.close),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              AppStrings.scoreTableTitle,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          IconButton(
            onPressed: onDismiss,
            icon: const Icon(Icons.close),
            tooltip: AppStrings.close,
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentScore(ThemeData theme) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              AppStrings.currentScore,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            LayoutBuilder(
              builder: (context, constraints) {
                const count = 4;
                final width = (constraints.maxWidth - 12 * (count - 1)) / count;
                return Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: List.generate(
                    gameState.players.length.clamp(0, 4),
                    (i) => SizedBox(
                      width: width > 0 ? width : null,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            gameState.players[i],
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${gameState.scores.length > i ? gameState.scores[i] : 0}',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: _scoreColor(theme, gameState.scores.length > i ? gameState.scores[i] : 0),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Color _scoreColor(ThemeData theme, int score) {
    if (score > 0) return theme.colorScheme.primary;
    if (score < 0) return theme.colorScheme.error;
    return theme.colorScheme.onSurface;
  }

  Future<void> _onDeleteTapped(BuildContext context) async {
    final ok = await showConfirmDialog(
      context,
      title: AppStrings.confirmDelete,
      message: AppStrings.confirmDeleteGame,
      confirmLabel: AppStrings.delete,
      cancelLabel: AppStrings.cancel,
      isDestructive: true,
    );
    if (context.mounted && ok) onDeleteRequested();
  }
}

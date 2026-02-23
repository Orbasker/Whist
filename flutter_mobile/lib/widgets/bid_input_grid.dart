import 'package:flutter/material.dart';

/// Bid selection grid 0–13 aligned with Angular BidInputGridComponent.
/// Two rows: [6,5,4,3,2,1,0] and [13,12,11,10,9,8,7].
class BidInputGrid extends StatelessWidget {
  const BidInputGrid({
    super.key,
    required this.selectedBid,
    required this.onBidSelect,
    this.enabled = true,
  });

  final int selectedBid;
  final ValueChanged<int> onBidSelect;
  final bool enabled;

  static const List<int> _row1 = [6, 5, 4, 3, 2, 1, 0];
  static const List<int> _row2 = [13, 12, 11, 10, 9, 8, 7];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: _row1
              .map((n) => _buildChip(context, n, colorScheme, theme))
              .toList(),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: _row2
              .map((n) => _buildChip(context, n, colorScheme, theme))
              .toList(),
        ),
      ],
    );
  }

  Widget _buildChip(
    BuildContext context,
    int value,
    ColorScheme colorScheme,
    ThemeData theme,
  ) {
    final isSelected = selectedBid == value;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Material(
        color: isSelected
            ? colorScheme.primary
            : colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: enabled ? () => onBidSelect(value) : null,
          borderRadius: BorderRadius.circular(12),
          child: Opacity(
            opacity: enabled ? 1 : 0.5,
            child: SizedBox(
              width: 40,
              height: 44,
              child: Center(
                child: Text(
                  '$value',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: isSelected
                        ? colorScheme.onPrimary
                        : colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

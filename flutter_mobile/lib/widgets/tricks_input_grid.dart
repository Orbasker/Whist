import 'package:flutter/material.dart';

/// Grid of trick counts 0–13 for selecting how many tricks a player took.
/// Matches Angular tricks-input-grid (two rows: 6,5,4,3,2,1,0 and 13,12,11,10,9,8,7).
class TricksInputGrid extends StatelessWidget {
  const TricksInputGrid({
    super.key,
    required this.selectedTrick,
    required this.onTrickSelected,
    this.enabled = true,
  });

  final int selectedTrick;
  final ValueChanged<int> onTrickSelected;
  final bool enabled;

  static const List<int> _row1 = [6, 5, 4, 3, 2, 1, 0];
  static const List<int> _row2 = [13, 12, 11, 10, 9, 8, 7];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: _row1.map((n) => _cell(context, theme, n)).toList(),
        ),
        const SizedBox(height: 6),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: _row2.map((n) => _cell(context, theme, n)).toList(),
        ),
      ],
    );
  }

  Widget _cell(BuildContext context, ThemeData theme, int value) {
    final isSelected = selectedTrick == value;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 3),
      child: Material(
        color: isSelected ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: enabled ? () => onTrickSelected(value) : null,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            constraints: const BoxConstraints(minWidth: 36, minHeight: 40),
            alignment: Alignment.center,
            child: Text(
              '$value',
              style: theme.textTheme.titleSmall?.copyWith(
                color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

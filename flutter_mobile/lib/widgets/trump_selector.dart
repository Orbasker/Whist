import 'package:flutter/material.dart';

import '../l10n/app_strings.dart';

/// Trump suit selector aligned with Angular TrumpSelectorComponent.
/// Options: no trump, spades, clubs, diamonds, hearts.
class TrumpSelector extends StatelessWidget {
  const TrumpSelector({
    super.key,
    required this.selectedTrump,
    required this.onTrumpSelect,
  });

  final String? selectedTrump;
  final ValueChanged<String?> onTrumpSelect;

  static const List<({String? value, String label, String icon, bool isRed})>
  _options = [
    (value: null, label: AppStrings.trumpNoTrump, icon: '✕', isRed: false),
    (value: 'spades', label: AppStrings.trumpSpades, icon: '♠', isRed: false),
    (value: 'clubs', label: AppStrings.trumpClubs, icon: '♣', isRed: false),
    (
      value: 'diamonds',
      label: AppStrings.trumpDiamonds,
      icon: '♦',
      isRed: true,
    ),
    (value: 'hearts', label: AppStrings.trumpHearts, icon: '♥', isRed: true),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _options.map((opt) {
        final isSelected = selectedTrump == opt.value;
        return Material(
          color: isSelected
              ? colorScheme.primary
              : colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            onTap: () => onTrumpSelect(opt.value),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (opt.icon.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Text(
                        opt.icon,
                        style: TextStyle(
                          color: isSelected
                              ? colorScheme.onPrimary
                              : (opt.isRed
                                    ? Colors.red.shade700
                                    : colorScheme.onSurfaceVariant),
                        ),
                      ),
                    ),
                  Text(
                    opt.label,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: isSelected
                          ? colorScheme.onPrimary
                          : colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

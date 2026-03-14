import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Gradient background matching the Angular web's
/// `bg-gradient-to-br from-background via-card to-background`.
class GradientBackground extends StatelessWidget {
  const GradientBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.gradientFrom,
            AppColors.gradientVia,
            AppColors.gradientTo,
          ],
        ),
      ),
      child: child,
    );
  }
}

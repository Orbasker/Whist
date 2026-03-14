import 'package:flutter/material.dart';

/// Design tokens mirroring the Angular web frontend's shadcn dark theme.
/// Source: angular-web/src/styles/_shadcn-theme.scss + _variables.scss
abstract final class AppColors {
  // --- Core palette (from _shadcn-theme.scss HSL tokens) ---

  /// --background: 212 39% 10%  (deep dark blue/slate)
  static const Color background = Color(0xFF0F172A);

  /// --foreground: 210 40% 96%  (almost-white text)
  static const Color foreground = Color(0xFFF1F5F9);

  /// --card: 214 35% 16%  (slightly lighter than background)
  static const Color card = Color(0xFF1A2744);

  /// --primary: 199 89% 46%  (sky/cyan blue accent)
  static const Color primary = Color(0xFF0EA5E9);

  /// --primary-foreground: same as background
  static const Color primaryForeground = Color(0xFF0F172A);

  /// --secondary / --border / --muted: 203 40% 21%
  static const Color secondary = Color(0xFF203349);

  /// --muted-foreground: 215 20% 65%
  static const Color mutedForeground = Color(0xFF94A3B8);

  /// --destructive: 0 84% 60%
  static const Color destructive = Color(0xFFEF4444);

  /// --success: 142 71% 45%
  static const Color success = Color(0xFF22C55E);

  /// Same as secondary
  static const Color border = Color(0xFF203349);

  // --- Button system (from _buttons.scss + _variables.scss) ---

  /// btn-primary background: amber-600
  static const Color buttonPrimary = Color(0xFFD97706);

  /// btn-primary hover: amber-500
  static const Color buttonPrimaryHover = Color(0xFFF59E0B);

  // --- Input system (shadcn overrides _variables.scss) ---

  /// --input-bg: hsl(var(--muted)) = 203 40% 21%
  static const Color inputBackground = Color(0xFF203349);

  /// --input-border: hsl(var(--border)) = 203 40% 21%
  static const Color inputBorder = Color(0xFF203349);

  // --- Gradient (matches web's bg-gradient-to-br) ---
  static const Color gradientFrom = background;
  static const Color gradientVia = card;
  static const Color gradientTo = background;
}

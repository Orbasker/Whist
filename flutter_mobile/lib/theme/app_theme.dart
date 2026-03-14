import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Builds the app-wide ThemeData matching the Angular web dark theme.
ThemeData buildAppTheme() {
  final colorScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: AppColors.primary,
    onPrimary: AppColors.primaryForeground,
    primaryContainer: AppColors.primary.withOpacity(0.2),
    onPrimaryContainer: AppColors.primary,
    secondary: AppColors.secondary,
    onSecondary: AppColors.foreground,
    secondaryContainer: AppColors.secondary.withOpacity(0.5),
    onSecondaryContainer: AppColors.foreground,
    tertiary: AppColors.buttonPrimary,
    onTertiary: Colors.white,
    tertiaryContainer: AppColors.buttonPrimaryHover.withOpacity(0.2),
    onTertiaryContainer: AppColors.buttonPrimaryHover,
    error: AppColors.destructive,
    onError: Colors.white,
    errorContainer: AppColors.destructive.withOpacity(0.15),
    onErrorContainer: AppColors.destructive,
    surface: AppColors.background,
    onSurface: AppColors.foreground,
    onSurfaceVariant: AppColors.mutedForeground,
    outline: AppColors.border,
    outlineVariant: AppColors.border.withOpacity(0.5),
    inverseSurface: AppColors.foreground,
    onInverseSurface: AppColors.background,
    inversePrimary: AppColors.primary,
    shadow: Colors.black,
    scrim: Colors.black54,
    surfaceContainerLowest: AppColors.background,
    surfaceContainerLow: AppColors.background,
    surfaceContainer: AppColors.card,
    surfaceContainerHigh: AppColors.card,
    surfaceContainerHighest: AppColors.secondary,
  );

  final textTheme = GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme);

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    textTheme: textTheme,
    scaffoldBackgroundColor: AppColors.background,

    // AppBar: match web's sticky header
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.foreground,
      elevation: 0,
      scrolledUnderElevation: 1,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: GoogleFonts.outfit(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: AppColors.foreground,
      ),
    ),

    // Card: 16px radius, card bg, 1px border, no elevation
    cardTheme: CardTheme(
      color: AppColors.card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.border),
      ),
      surfaceTintColor: Colors.transparent,
    ),

    // FilledButton: amber-600, min 44px, 8px radius, weight 600
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.buttonPrimary,
        foregroundColor: Colors.white,
        minimumSize: const Size(0, 44),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: GoogleFonts.outfit(
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),

    // OutlinedButton: matching size, input-border color
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.foreground,
        minimumSize: const Size(0, 44),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        side: const BorderSide(color: AppColors.inputBorder),
        textStyle: GoogleFonts.outfit(
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),

    // TextButton: primary (sky blue) foreground
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        minimumSize: const Size(0, 44),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: GoogleFonts.outfit(
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),

    // Input: 44px, slate-700 fill, slate-600 border, 8px radius, primary focus
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.inputBackground,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      constraints: const BoxConstraints(minHeight: 44),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.inputBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.inputBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.destructive),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.destructive, width: 2),
      ),
      labelStyle: GoogleFonts.outfit(
        color: AppColors.mutedForeground,
        fontWeight: FontWeight.w600,
        fontSize: 14,
      ),
      hintStyle: GoogleFonts.outfit(
        color: AppColors.mutedForeground.withOpacity(0.7),
      ),
      errorStyle: GoogleFonts.outfit(
        color: AppColors.destructive,
        fontSize: 13,
      ),
    ),

    // Dialog: card bg, 16px radius, border
    dialogTheme: DialogTheme(
      backgroundColor: AppColors.card,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.border),
      ),
      titleTextStyle: GoogleFonts.outfit(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: AppColors.foreground,
      ),
    ),

    // BottomSheet: card bg, 16px top radius
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppColors.card,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
    ),

    dividerTheme: const DividerThemeData(color: AppColors.border, thickness: 1),

    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: AppColors.primary,
      linearTrackColor: AppColors.secondary,
    ),

    popupMenuTheme: PopupMenuThemeData(
      color: AppColors.card,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border),
      ),
    ),

    snackBarTheme: SnackBarThemeData(
      backgroundColor: AppColors.card,
      contentTextStyle: GoogleFonts.outfit(color: AppColors.foreground),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),

    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(minimumSize: const Size(44, 44)),
    ),
  );
}

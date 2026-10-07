import 'package:flutter/material.dart';

/// Mirrors the web app's CSS tokens (globals.css) so both apps look the same.
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.surface,
    required this.surface2,
    required this.muted,
    required this.border,
    required this.income,
    required this.incomeSoft,
    required this.expense,
    required this.expenseSoft,
    required this.success,
    required this.accentOrange,
  });

  final Color surface;
  final Color surface2;
  final Color muted;
  final Color border;
  final Color income;
  final Color incomeSoft;
  final Color expense;
  final Color expenseSoft;
  final Color success;
  final Color accentOrange;

  static const light = AppColors(
    surface: Color(0xFFF2F2F7),
    surface2: Color(0xFFE5E5EA),
    muted: Color(0xFF8E8E93),
    border: Color(0xFFE9ECEF),
    income: Color(0xFF00B102),
    incomeSoft: Color(0xFFE6FBE6),
    expense: Color(0xFFFF3B30),
    expenseSoft: Color(0xFFFDE6E6),
    success: Color(0xFF00A86B),
    accentOrange: Color(0xFFFF6F37),
  );

  static const dark = AppColors(
    surface: Color(0xFF1E1E20),
    surface2: Color(0xFF2C2C2E),
    muted: Color(0xFF8E8E93),
    border: Color(0x14FFFFFF),
    income: Color(0xFF32D74B),
    incomeSoft: Color(0x2432D74B),
    expense: Color(0xFFFF453A),
    expenseSoft: Color(0x24FF453A),
    success: Color(0xFF30D158),
    accentOrange: Color(0xFFFF7A45),
  );

  @override
  AppColors copyWith() => this;

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    Color l(Color a, Color b) => Color.lerp(a, b, t)!;
    return AppColors(
      surface: l(surface, other.surface),
      surface2: l(surface2, other.surface2),
      muted: l(muted, other.muted),
      border: l(border, other.border),
      income: l(income, other.income),
      incomeSoft: l(incomeSoft, other.incomeSoft),
      expense: l(expense, other.expense),
      expenseSoft: l(expenseSoft, other.expenseSoft),
      success: l(success, other.success),
      accentOrange: l(accentOrange, other.accentOrange),
    );
  }
}

extension AppColorsX on BuildContext {
  AppColors get colors => Theme.of(this).extension<AppColors>()!;
}

ThemeData _build(Brightness brightness) {
  final isDark = brightness == Brightness.dark;
  final colors = isDark ? AppColors.dark : AppColors.light;
  final background = isDark ? const Color(0xFF0B0B0C) : Colors.white;
  final foreground = isDark ? const Color(0xFFF5F5F7) : const Color(0xFF1C1C1E);

  final scheme = ColorScheme.fromSeed(
    seedColor: const Color(0xFF4285F4),
    brightness: brightness,
  ).copyWith(
    surface: background,
    onSurface: foreground,
    primary: foreground,
    onPrimary: background,
    error: colors.expense,
    outline: colors.border,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: background,
    extensions: [colors],
    splashFactory: NoSplash.splashFactory,
    appBarTheme: AppBarTheme(
      backgroundColor: background,
      foregroundColor: foreground,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(color: foreground, fontSize: 20, fontWeight: FontWeight.w700),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: colors.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      hintStyle: TextStyle(color: colors.muted),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: foreground.withValues(alpha: 0.3)),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: colors.expense),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        shape: const StadiumBorder(),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    dividerTheme: DividerThemeData(color: colors.border, thickness: 1, space: 1),
  );
}

final lightTheme = _build(Brightness.light);
final darkTheme = _build(Brightness.dark);

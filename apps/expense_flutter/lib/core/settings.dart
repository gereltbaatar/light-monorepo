import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Overridden in main() with the instance loaded before runApp.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('sharedPreferencesProvider must be overridden'),
);

enum AppLocale { mn, en }

class ThemeModeNotifier extends Notifier<ThemeMode> {
  static const _key = 'theme';

  @override
  ThemeMode build() {
    final stored = ref.read(sharedPreferencesProvider).getString(_key);
    return ThemeMode.values.firstWhere((m) => m.name == stored, orElse: () => ThemeMode.system);
  }

  void set(ThemeMode mode) {
    state = mode;
    ref.read(sharedPreferencesProvider).setString(_key, mode.name);
  }
}

final themeModeProvider = NotifierProvider<ThemeModeNotifier, ThemeMode>(ThemeModeNotifier.new);

class LocaleNotifier extends Notifier<AppLocale> {
  static const _key = 'locale';

  @override
  AppLocale build() {
    final stored = ref.read(sharedPreferencesProvider).getString(_key);
    // Mongolian by default, matching the web app.
    return AppLocale.values.firstWhere((l) => l.name == stored, orElse: () => AppLocale.mn);
  }

  void set(AppLocale locale) {
    state = locale;
    ref.read(sharedPreferencesProvider).setString(_key, locale.name);
  }
}

final localeProvider = NotifierProvider<LocaleNotifier, AppLocale>(LocaleNotifier.new);

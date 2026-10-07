import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/env.dart';
import 'core/i18n.dart';
import 'core/router.dart';
import 'core/settings.dart';
import 'core/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (!Env.isConfigured) {
    runApp(const _MissingConfigApp());
    return;
  }

  await Future.wait([
    Supabase.initialize(url: Env.supabaseUrl, publishableKey: Env.supabaseAnonKey),
    initializeDateFormatting('mn'),
    initializeDateFormatting('en_US'),
  ]);
  final prefs = await SharedPreferences.getInstance();

  runApp(ProviderScope(
    overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
    child: const ExpenseApp(),
  ));
}

class ExpenseApp extends ConsumerWidget {
  const ExpenseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'Expense Tracker',
      debugShowCheckedModeBanner: false,
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: ref.watch(themeModeProvider),
      routerConfig: ref.watch(routerProvider),
      locale: Locale(intlLocale[ref.watch(localeProvider)]!.split('_').first),
      supportedLocales: const [Locale('mn'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
    );
  }
}

class _MissingConfigApp extends StatelessWidget {
  const _MissingConfigApp();

  @override
  Widget build(BuildContext context) => const MaterialApp(
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'Missing config. Run with:\nflutter run --dart-define-from-file=env.json',
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      );
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/i18n.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import 'profile_strings.dart';
import 'settings_widgets.dart';

class LanguageScreen extends ConsumerWidget {
  const LanguageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(profileStrings);
    final current = ref.watch(localeProvider);
    final colors = context.colors;

    return SettingsScaffold(
      title: t.language,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: SettingsGroup(
            children: [
              for (final locale in AppLocale.values)
                SettingsRow(
                  title: localeNames[locale]!,
                  leading: SizedBox(
                    width: 28,
                    child: Text(
                      locale.name.toUpperCase(),
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: colors.muted),
                    ),
                  ),
                  showChevron: false,
                  trailing: current == locale ? const CheckMark() : null,
                  onTap: () => ref.read(localeProvider.notifier).set(locale),
                ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 0),
          child: Text(t.languageHint, style: TextStyle(fontSize: 14, color: colors.muted)),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/i18n.dart';
import '../../core/settings.dart';
import 'profile_strings.dart';
import 'settings_widgets.dart';

const themeIcons = {
  ThemeMode.system: Icons.desktop_windows_outlined,
  ThemeMode.light: Icons.light_mode_outlined,
  ThemeMode.dark: Icons.dark_mode_outlined,
};

String themeLabel(ProfileStrings t, ThemeMode mode) => switch (mode) {
      ThemeMode.system => t.themeSystem,
      ThemeMode.light => t.themeLight,
      ThemeMode.dark => t.themeDark,
    };

class AppearanceScreen extends ConsumerWidget {
  const AppearanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(profileStrings);
    final current = ref.watch(themeModeProvider);

    return SettingsScaffold(
      title: t.appearance,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: SettingsGroup(
            children: [
              for (final mode in ThemeMode.values)
                SettingsRow(
                  title: themeLabel(t, mode),
                  leading: Icon(themeIcons[mode]),
                  showChevron: false,
                  trailing: current == mode ? const CheckMark() : null,
                  onTap: () => ref.read(themeModeProvider.notifier).set(mode),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show CountOption;

import '../../core/i18n.dart';
import '../../core/money.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../../data/repository.dart';
import '../ai/ai_settings_screen.dart';
import '../ai/ai_strings.dart';
import 'appearance_screen.dart';
import 'categories_screen.dart';
import 'general_settings_screen.dart';
import 'language_screen.dart';
import 'profile_strings.dart';
import 'settings_widgets.dart';

typedef _ProfileStats = ({int total, int month, double monthSpent, DateTime? lastSignIn});

final _profileStatsProvider = FutureProvider<_ProfileStats>((ref) async {
  ref.watch(dataVersionProvider);
  final db = ref.watch(supabaseProvider);
  final now = DateTime.now();
  final monthStart = DateTime(now.year, now.month);
  final (total, month) = await (
    Future.value(db.from('transactions').count(CountOption.exact)),
    ref.watch(repositoryProvider).transactionsBetween(monthStart, DateTime(now.year, now.month + 1)),
  ).wait;
  final lastSignIn = db.auth.currentUser?.lastSignInAt;
  return (
    total: total,
    month: month.length,
    monthSpent: month.where((tx) => !tx.isIncome).fold(0.0, (sum, tx) => sum + tx.amount),
    lastSignIn: lastSignIn == null ? null : DateTime.tryParse(lastSignIn)?.toLocal(),
  );
});

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async => ref.read(dataVersionProvider.notifier).bump(),
          child: ListView(
            padding: const EdgeInsets.only(bottom: navClearance),
            children: const [_ProfileHeader(), _UserInfo(), _Settings()],
          ),
        ),
      ),
    );
  }
}

class _ProfileHeader extends ConsumerWidget {
  const _ProfileHeader();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider).value;
    final colors = context.colors;
    const style = TextStyle(fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.5, height: 1.25);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(profile?.name ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: style),
                Text(
                  profile?.email ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: style.copyWith(color: colors.muted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          ProfileAvatar(url: profile?.avatarUrl, size: 56),
        ],
      ),
    );
  }
}

class _UserInfo extends ConsumerWidget {
  const _UserInfo();

  String _relative(ProfileStrings t, DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return t.justNow;
    if (diff.inMinutes < 60) return t.minutesAgo(diff.inMinutes);
    if (diff.inHours < 24) return t.hoursAgo(diff.inHours);
    return t.daysAgo(diff.inDays);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(profileStrings);
    final locale = intlLocale[ref.watch(localeProvider)];
    final stats = ref.watch(_profileStatsProvider).value;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final green = isDark ? const Color(0xFF7BC47F) : const Color(0xFF2D5016);
    final blue = isDark ? const Color(0xFF64B5F6) : const Color(0xFF1565C0);
    final lastSignIn = stats?.lastSignIn ?? DateTime.now();
    final recent = DateTime.now().difference(lastSignIn).inDays < 7;
    final detail = DateFormat('MMM d, h:mm a', locale).format(lastSignIn);

    final cards = [
      _StatCard(
        value: '${stats?.total ?? '–'}',
        title: t.allTransactions,
        caption: t.allTime,
        accent: green,
        arrowColor: Theme.of(context).colorScheme.onSurface,
      ),
      _StatCard(
        value: '${stats?.month ?? '–'}',
        title: t.monthTransactions,
        caption: t.spent(money(stats?.monthSpent ?? 0)),
        accent: green,
        arrowColor: green,
      ),
      _StatCard(
        value: stats == null ? '–' : (recent ? _relative(t, lastSignIn) : detail),
        title: t.lastLogin,
        titleColor: blue,
        caption: detail,
        accent: blue,
        arrowColor: blue,
        arrowOpacity: 0.4,
      ),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final width = (constraints.maxWidth - 6) / 2;
          return Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [for (final card in cards) SizedBox(width: width, child: card)],
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.value,
    required this.title,
    required this.caption,
    required this.accent,
    required this.arrowColor,
    this.titleColor,
    this.arrowOpacity = 0.3,
  });

  final String value;
  final String title;
  final String caption;
  final Color accent;
  final Color arrowColor;
  final Color? titleColor;
  final double arrowOpacity;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 92,
      decoration: BoxDecoration(color: context.colors.surface, borderRadius: BorderRadius.circular(24)),
      child: Stack(
        children: [
          Positioned(
            top: 12,
            right: 12,
            child: Icon(Icons.north_east_rounded, size: 26, color: arrowColor.withValues(alpha: arrowOpacity)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 40, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: -0.4),
                ),
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: titleColor),
                ),
                const SizedBox(height: 2),
                Text(
                  caption,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12, color: accent),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Settings extends ConsumerWidget {
  const _Settings();

  void _push(BuildContext context, Widget screen) =>
      Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => screen));

  Future<void> _confirmSignOut(BuildContext context, WidgetRef ref, ProfileStrings t) async {
    final colors = context.colors;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(t.signOut),
        content: Text(t.signOutConfirm),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: Text(t.cancel)),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: TextButton.styleFrom(foregroundColor: colors.expense),
            child: Text(t.signOut),
          ),
        ],
      ),
    );
    if (confirmed == true) await ref.read(supabaseProvider).auth.signOut();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(profileStrings);
    final locale = ref.watch(localeProvider);
    final mode = ref.watch(themeModeProvider);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: Column(
        children: [
          SettingsGroup(
            children: [
              SettingsRow(
                title: t.general,
                leading: const Icon(Icons.settings_outlined),
                onTap: () => _push(context, const GeneralSettingsScreen()),
              ),
              SettingsRow(
                title: t.categories,
                leading: const Icon(Icons.grid_view_rounded),
                onTap: () => _push(context, const CategoriesScreen()),
              ),
              SettingsRow(
                title: t.language,
                leading: const Icon(Icons.language_rounded),
                rightLabel: localeNames[locale],
                onTap: () => _push(context, const LanguageScreen()),
              ),
              SettingsRow(
                title: t.appearance,
                leading: const Icon(Icons.palette_outlined),
                rightLabel: themeLabel(t, mode),
                onTap: () => _push(context, const AppearanceScreen()),
              ),
              SettingsRow(
                title: ref.tr(aiStrings).section,
                leading: const Icon(Icons.auto_awesome_outlined),
                onTap: () => _push(context, const AiSettingsScreen()),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SettingsGroup(
            children: [
              SettingsRow(
                title: t.signOut,
                leading: const Icon(Icons.logout_rounded),
                color: context.colors.expense,
                showChevron: false,
                onTap: () => _confirmSignOut(context, ref, t),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

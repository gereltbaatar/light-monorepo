import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:image_picker/image_picker.dart';

import '../../core/ai_settings.dart';
import '../../core/i18n.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../ai/ai_entry_strings.dart';
import '../ai/receipt_scan.dart';
import '../ai/voice_entry.dart';
import '../transactions/transaction_form_sheet.dart';

const Dict<({String home, String stats, String advisor, String profile, String add})> _labels = (
  en: (home: 'Home', stats: 'Stats', advisor: 'Advisor', profile: 'Profile', add: 'Add transaction'),
  mn: (home: 'Нүүр', stats: 'Статистик', advisor: 'Зөвлөх', profile: 'Профайл', add: 'Гүйлгээ нэмэх'),
);

/// Floating dark pill like the web BottomNav, plus a round add button.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.shell});
  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(_labels);
    final ai = ref.watch(aiSettingsProvider);
    final advisorOn = ai[AiFeature.advisor] ?? true;
    final voiceOn = ai[AiFeature.voice] ?? true;
    final receiptOn = ai[AiFeature.receipt] ?? true;
    final navBottom = MediaQuery.paddingOf(context).bottom.clamp(12.0, double.infinity);
    final items = [
      (Icons.home_rounded, t.home, 0),
      (Icons.trending_up_rounded, t.stats, 1),
      if (advisorOn) (Icons.auto_awesome_rounded, t.advisor, 2),
      (Icons.person_rounded, t.profile, 3),
    ];

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          Positioned.fill(child: shell),
          if (voiceOn)
            Positioned(
              right: 26,
              bottom: navBottom + 72 + 12,
              child: _RoundButton(
                label: ref.tr(aiEntryStrings).addByVoice,
                size: 52,
                icon: Icons.mic_rounded,
                iconSize: 22,
                onTap: () => startVoiceEntry(context, ref),
              ),
            ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        child: Row(
          children: [
            Expanded(
              child: Container(
                height: 72,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF1C1C1E),
                  borderRadius: BorderRadius.circular(36),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                  boxShadow: const [BoxShadow(color: Color(0x40000000), blurRadius: 20, offset: Offset(0, 8))],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    for (final (icon, label, branch) in items)
                      _NavItem(
                        icon: icon,
                        label: label,
                        active: shell.currentIndex == branch,
                        onTap: () => shell.goBranch(branch, initialLocation: branch == shell.currentIndex),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            _RoundButton(
              label: t.add,
              size: 72,
              icon: Icons.add_rounded,
              iconSize: 32,
              onTap: () => receiptOn ? _showAddMenu(context, ref) : showTransactionForm(context),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({required this.icon, required this.label, required this.active, required this.onTap});
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      selected: active,
      button: true,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOutBack,
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: active ? Colors.white : Colors.transparent,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 22, color: active ? const Color(0xFF1C1C1E) : Colors.white54),
        ),
      ),
    );
  }
}

enum _AddChoice { camera, gallery, manual }

Future<void> _showAddMenu(BuildContext context, WidgetRef ref) async {
  final t = ref.read(localeProvider) == AppLocale.mn ? aiEntryStrings.mn : aiEntryStrings.en;
  final choice = await showModalBottomSheet<_AddChoice>(
    context: context,
    useSafeArea: true,
    showDragHandle: true,
    backgroundColor: Theme.of(context).scaffoldBackgroundColor,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
    builder: (sheet) {
      final colors = sheet.colors;
      Widget option(_AddChoice value, IconData icon, String label) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: colors.surface,
              borderRadius: BorderRadius.circular(20),
              child: InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: () => Navigator.of(sheet).pop(value),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(color: colors.surface2, shape: BoxShape.circle),
                        child: Icon(icon, size: 20),
                      ),
                      const SizedBox(width: 14),
                      Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
            ),
          );
      return Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            option(_AddChoice.camera, Icons.document_scanner_rounded, t.scanReceipt),
            option(_AddChoice.gallery, Icons.photo_library_rounded, t.fromGallery),
            option(_AddChoice.manual, Icons.edit_rounded, t.enterManually),
          ],
        ),
      );
    },
  );
  if (choice == null || !context.mounted) return;
  switch (choice) {
    case _AddChoice.camera:
      await startReceiptScan(context, ref);
    case _AddChoice.gallery:
      await startReceiptScan(context, ref, source: ImageSource.gallery);
    case _AddChoice.manual:
      await showTransactionForm(context);
  }
}

class _RoundButton extends StatelessWidget {
  const _RoundButton({
    required this.label,
    required this.size,
    required this.icon,
    required this.iconSize,
    required this.onTap,
  });
  final String label;
  final double size;
  final IconData icon;
  final double iconSize;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      button: true,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: const Color(0xFF1C1C1E),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            boxShadow: const [BoxShadow(color: Color(0x40000000), blurRadius: 20, offset: Offset(0, 8))],
          ),
          child: Icon(icon, color: Colors.white, size: iconSize),
        ),
      ),
    );
  }
}

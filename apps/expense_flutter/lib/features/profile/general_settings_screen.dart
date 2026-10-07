import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import 'profile_strings.dart';
import 'settings_widgets.dart';

const _maxNameLength = 60;

class GeneralSettingsScreen extends ConsumerWidget {
  const GeneralSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(profileStrings);
    final profile = ref.watch(profileProvider);

    return SettingsScaffold(
      title: t.general,
      children: [
        switch (profile.value) {
          final value? => _GeneralForm(profile: value),
          null when profile.hasError => Padding(
              padding: const EdgeInsets.all(24),
              child: Center(child: Text(t.saveFailed)),
            ),
          _ => const Padding(
              padding: EdgeInsets.all(48),
              child: Center(child: CircularProgressIndicator()),
            ),
        },
      ],
    );
  }
}

class _GeneralForm extends ConsumerStatefulWidget {
  const _GeneralForm({required this.profile});

  final Profile profile;

  @override
  ConsumerState<_GeneralForm> createState() => _GeneralFormState();
}

class _GeneralFormState extends ConsumerState<_GeneralForm> {
  late final _controller = TextEditingController(text: widget.profile.name);
  late String _saved = widget.profile.name;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save(ProfileStrings t) async {
    final name = _controller.text.trim();
    final messenger = ScaffoldMessenger.of(context);
    String? error;
    if (name.isEmpty) error = t.nameEmpty;
    if (name.length > _maxNameLength) error = t.nameTooLong;
    if (error != null) {
      messenger.showSnackBar(SnackBar(content: Text(error)));
      return;
    }

    setState(() => _saving = true);
    try {
      await ref.read(repositoryProvider).updateDisplayName(name);
      _saved = name;
      ref.read(dataVersionProvider.notifier).bump();
      messenger.showSnackBar(SnackBar(content: Text(t.profileUpdated)));
    } catch (_) {
      messenger.showSnackBar(SnackBar(content: Text(t.saveFailed)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(profileStrings);
    final colors = context.colors;
    final scheme = Theme.of(context).colorScheme;
    final unchanged = _controller.text.trim() == _saved.trim();
    final labelStyle = TextStyle(fontSize: 14, color: colors.muted);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(child: ProfileAvatar(url: widget.profile.avatarUrl, size: 96)),
          const SizedBox(height: 24),
          Text(t.name, style: labelStyle),
          const SizedBox(height: 8),
          TextField(
            controller: _controller,
            textInputAction: TextInputAction.done,
            inputFormatters: [LengthLimitingTextInputFormatter(_maxNameLength)],
            onSubmitted: (_) => unchanged || _saving ? null : _save(t),
            decoration: InputDecoration(
              hintText: t.namePlaceholder,
              suffixIcon: Padding(
                padding: const EdgeInsets.all(6),
                child: Opacity(
                  opacity: unchanged || _saving ? 0.3 : 1,
                  child: Material(
                    color: scheme.primary,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: unchanged || _saving ? null : () => _save(t),
                      child: SizedBox(
                        width: 72,
                        child: Center(
                          child: Text(
                            t.save,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: scheme.onPrimary,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(t.email, style: labelStyle),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            height: 48,
            alignment: Alignment.centerLeft,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(color: colors.surface2, borderRadius: BorderRadius.circular(16)),
            child: Text(
              widget.profile.email,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 16, color: colors.muted),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(t.emailLocked, style: TextStyle(fontSize: 12, color: colors.muted)),
          ),
        ],
      ),
    );
  }
}

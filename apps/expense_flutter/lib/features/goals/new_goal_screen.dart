import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../core/i18n.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../../data/cloudinary.dart';
import '../../data/goals_repository.dart';
import '../../data/repository.dart';
import 'goals_strings.dart';

const _maxImageBytes = 5 * 1024 * 1024;

double? _parseAmount(String raw) {
  final cleaned = raw.trim().replaceAll(',', '').replaceAll(' ', '');
  if (cleaned.isEmpty) return null;
  final n = double.tryParse(cleaned);
  return n != null && n.isFinite ? n : null;
}

class NewGoalScreen extends ConsumerStatefulWidget {
  const NewGoalScreen({super.key});

  @override
  ConsumerState<NewGoalScreen> createState() => _NewGoalScreenState();
}

class _NewGoalScreenState extends ConsumerState<NewGoalScreen> {
  GoalKind _kind = GoalKind.savings;
  final _title = TextEditingController();
  final _target = TextEditingController();
  final _initial = TextEditingController();
  final _contribution = TextEditingController();
  Uint8List? _image;
  String _imageName = 'goal.jpg';
  DateTime? _targetDate;
  DateTime _startDate = DateUtils.dateOnly(DateTime.now());
  GoalCategory _category = GoalCategory.general;
  GoalPeriod _period = GoalPeriod.monthly;
  bool _remindDue = false;
  bool _remindMilestone = false;
  bool _autoContribute = true;
  bool _saving = false;

  @override
  void dispose() {
    _title.dispose();
    _target.dispose();
    _initial.dispose();
    _contribution.dispose();
    super.dispose();
  }

  Future<void> _pickImage(GoalsStrings t) async {
    final messenger = ScaffoldMessenger.of(context);
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 2400, imageQuality: 85);
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    if (bytes.lengthInBytes > _maxImageBytes) {
      messenger.showSnackBar(SnackBar(content: Text(t.imageTooLarge)));
      return;
    }
    if (mounted) {
      setState(() {
        _image = bytes;
        _imageName = picked.name;
      });
    }
  }

  Future<DateTime?> _pickDate(DateTime initial) => showDatePicker(
        context: context,
        initialDate: initial,
        firstDate: DateTime(2000),
        lastDate: DateTime(2100),
      );

  Future<void> _submit(GoalsStrings t) async {
    FocusScope.of(context).unfocus();
    setState(() => _saving = true);
    final messenger = ScaffoldMessenger.of(context);
    final router = GoRouter.of(context);
    final repo = ref.read(goalsRepositoryProvider);
    final version = ref.read(dataVersionProvider.notifier);
    final isPlan = _kind == GoalKind.plan;
    final String id;
    try {
      final image = _image;
      final imageUrl = image == null ? null : await uploadToCloudinary(image, filename: _imageName);
      id = await repo.createGoal(
        kind: _kind,
        title: _title.text,
        targetAmount: _parseAmount(_target.text) ?? 0,
        imageUrl: imageUrl,
        category: isPlan ? GoalCategory.general : _category,
        targetDate: isPlan ? null : _targetDate,
        initialAmount: isPlan ? null : _parseAmount(_initial.text),
        contributionAmount: isPlan ? _parseAmount(_contribution.text) : null,
        contributionPeriod: isPlan ? _period : null,
        startDate: isPlan ? _startDate : null,
        autoContribute: isPlan && _autoContribute,
        remindOnDue: isPlan && _remindDue,
        remindOnMilestone: isPlan && _remindMilestone,
      );
    } catch (e) {
      if (mounted) setState(() => _saving = false);
      messenger.showSnackBar(SnackBar(content: Text(e is GoalFailure ? e.message : '${t.createFailed}: $e')));
      return;
    }
    version.bump();
    messenger.showSnackBar(SnackBar(content: Text(t.goalCreated)));
    router.pushReplacement('/goals/$id');
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(goalsStrings);
    final colors = context.colors;
    final locale = intlLocale[ref.watch(localeProvider)];
    final dateFormat = DateFormat.yMMMd(locale);
    final isPlan = _kind == GoalKind.plan;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: t.back,
          icon: const Icon(Icons.chevron_left_rounded, size: 32),
          onPressed: () => context.canPop() ? context.pop() : context.go('/'),
        ),
        title: Text(t.newGoal, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
          children: [
            _KindTabs(kind: _kind, t: t, onChanged: (k) => setState(() => _kind = k)),
            const SizedBox(height: 16),
            _Field(
              label: t.coverImage,
              child: _ImagePickerBox(
                image: _image,
                t: t,
                onPick: () => _pickImage(t),
                onRemove: () => setState(() => _image = null),
              ),
            ),
            _Field(
              label: t.title,
              child: TextField(
                controller: _title,
                textCapitalization: TextCapitalization.sentences,
                decoration: InputDecoration(hintText: isPlan ? t.planTitlePlaceholder : t.savingsTitlePlaceholder),
              ),
            ),
            _Field(
              label: t.targetAmount,
              child: _AmountInput(controller: _target, hint: isPlan ? '3000000' : '1000000'),
            ),
            if (!isPlan) ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _Field(
                      label: t.alreadySaved,
                      child: _AmountInput(controller: _initial, hint: '0'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _Field(
                      label: t.targetDate,
                      child: _DateInput(
                        value: _targetDate == null ? null : dateFormat.format(_targetDate!),
                        onTap: () async {
                          final picked = await _pickDate(_targetDate ?? DateTime.now());
                          if (picked != null) setState(() => _targetDate = picked);
                        },
                        onClear: _targetDate == null ? null : () => setState(() => _targetDate = null),
                      ),
                    ),
                  ),
                ],
              ),
              _Field(
                label: t.category,
                child: DropdownButtonFormField<GoalCategory>(
                  initialValue: _category,
                  borderRadius: BorderRadius.circular(16),
                  icon: Icon(Icons.keyboard_arrow_down_rounded, color: colors.muted),
                  items: [
                    for (final c in GoalCategory.values)
                      DropdownMenuItem(value: c, child: Text(t.categories[c.name] ?? c.name)),
                  ],
                  onChanged: (c) => setState(() => _category = c ?? GoalCategory.general),
                ),
              ),
            ] else ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _Field(
                      label: t.contribute,
                      child: _AmountInput(controller: _contribution, hint: '200000'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _Field(
                      label: t.every,
                      child: DropdownButtonFormField<GoalPeriod>(
                        initialValue: _period,
                        borderRadius: BorderRadius.circular(16),
                        icon: Icon(Icons.keyboard_arrow_down_rounded, color: colors.muted),
                        items: [
                          for (final p in GoalPeriod.values)
                            DropdownMenuItem(value: p, child: Text(t.periodOptions[p.name] ?? p.name)),
                        ],
                        onChanged: (p) => setState(() => _period = p ?? GoalPeriod.monthly),
                      ),
                    ),
                  ),
                ],
              ),
              _Field(
                label: t.startDate,
                child: _DateInput(
                  value: dateFormat.format(_startDate),
                  onTap: () async {
                    final picked = await _pickDate(_startDate);
                    if (picked != null) setState(() => _startDate = picked);
                  },
                ),
              ),
              _Field(
                label: t.reminders,
                child: _Panel(
                  children: [
                    _ReminderRow(
                      label: t.remindDue,
                      value: _remindDue,
                      onChanged: (v) => setState(() => _remindDue = v),
                    ),
                    _ReminderRow(
                      label: t.remindMilestone,
                      value: _remindMilestone,
                      onChanged: (v) => setState(() => _remindMilestone = v),
                    ),
                  ],
                ),
              ),
              _Panel(
                children: [
                  _AutoContributeRow(
                    t: t,
                    value: _autoContribute,
                    onChanged: (v) => setState(() => _autoContribute = v),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _saving ? null : () => _submit(t),
              child: _saving
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: colors.muted),
                    )
                  : Text(t.createGoal),
            ),
          ],
        ),
      ),
    );
  }
}

class _KindTabs extends StatelessWidget {
  const _KindTabs({required this.kind, required this.t, required this.onChanged});
  final GoalKind kind;
  final GoalsStrings t;
  final ValueChanged<GoalKind> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final background = Theme.of(context).scaffoldBackgroundColor;

    Widget tab(GoalKind value, IconData icon, String label, String hint) {
      final active = value == kind;
      return Expanded(
        child: GestureDetector(
          onTap: () => onChanged(value),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: active ? (isDark ? colors.surface : background) : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
              boxShadow: active
                  ? [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 3, offset: const Offset(0, 1))]
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, size: 16, color: active ? null : colors.muted),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        label,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: active ? null : colors.muted,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(hint, style: TextStyle(fontSize: 12, color: colors.muted)),
              ],
            ),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: colors.surface2, borderRadius: BorderRadius.circular(16)),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            tab(GoalKind.savings, Icons.savings_outlined, t.savings, t.savingsHint),
            const SizedBox(width: 8),
            tab(GoalKind.plan, Icons.event_repeat_rounded, t.plan, t.planHint),
          ],
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.child});
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(label, style: TextStyle(fontSize: 14, color: context.colors.muted)),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _AmountInput extends StatelessWidget {
  const _AmountInput({required this.controller, required this.hint});
  final TextEditingController controller;
  final String hint;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(hintText: hint),
    );
  }
}

class _DateInput extends StatelessWidget {
  const _DateInput({required this.value, required this.onTap, this.onClear});
  final String? value;
  final VoidCallback onTap;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: InputDecorator(
        decoration: InputDecoration(
          suffixIcon: onClear == null
              ? Icon(Icons.calendar_today_outlined, size: 18, color: colors.muted)
              : IconButton(
                  icon: Icon(Icons.close_rounded, size: 18, color: colors.muted),
                  onPressed: onClear,
                ),
        ),
        child: Text(
          value ?? 'yyyy-mm-dd',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(fontSize: 16, color: value == null ? colors.muted : null),
        ),
      ),
    );
  }
}

class _ImagePickerBox extends StatelessWidget {
  const _ImagePickerBox({required this.image, required this.t, required this.onPick, required this.onRemove});
  final Uint8List? image;
  final GoalsStrings t;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final bytes = image;
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: bytes != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.memory(bytes, fit: BoxFit.cover),
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Material(
                      color: Colors.white.withValues(alpha: 0.9),
                      shape: const CircleBorder(),
                      child: IconButton(
                        tooltip: t.removeImage,
                        constraints: const BoxConstraints.tightFor(width: 32, height: 32),
                        padding: EdgeInsets.zero,
                        icon: const Icon(Icons.close_rounded, size: 16, color: Colors.black),
                        onPressed: onRemove,
                      ),
                    ),
                  ),
                ],
              ),
            )
          : Material(
              color: colors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: colors.border),
              ),
              child: InkWell(
                onTap: onPick,
                borderRadius: BorderRadius.circular(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_photo_alternate_outlined, size: 24, color: colors.muted),
                    const SizedBox(height: 8),
                    Text(t.addPhoto, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: colors.muted)),
                  ],
                ),
              ),
            ),
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) const Divider(),
            children[i],
          ],
        ],
      ),
    );
  }
}

class _ReminderRow extends StatelessWidget {
  const _ReminderRow({required this.label, required this.value, required this.onChanged});
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final foreground = Theme.of(context).colorScheme.onSurface;
    return InkWell(
      onTap: () => onChanged(!value),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        child: Row(
          children: [
            Expanded(child: Text(label, style: const TextStyle(fontSize: 14))),
            Checkbox(
              value: value,
              onChanged: (v) => onChanged(v ?? false),
              activeColor: foreground,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
          ],
        ),
      ),
    );
  }
}

class _AutoContributeRow extends StatelessWidget {
  const _AutoContributeRow({required this.t, required this.value, required this.onChanged});
  final GoalsStrings t;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      onTap: () => onChanged(!value),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t.autoContribute, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  Text(t.autoContributeHint, style: TextStyle(fontSize: 12, color: context.colors.muted)),
                ],
              ),
            ),
            Switch(
              value: value,
              onChanged: onChanged,
              activeThumbColor: scheme.surface,
              activeTrackColor: scheme.onSurface,
            ),
          ],
        ),
      ),
    );
  }
}

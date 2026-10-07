import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/categories.dart';
import '../../core/i18n.dart';
import '../../core/money.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import 'ai_entry_strings.dart';

/// One transaction the AI read, editable before it is saved.
class EntryDraft {
  EntryDraft({
    required this.type,
    required this.title,
    required this.amount,
    required this.category,
    required this.date,
    this.items = const [],
    this.confident = true,
  });

  TxType type;
  String title;
  double amount;
  Category category;
  DateTime date;
  List<ReceiptItem> items;
  bool confident;

  bool get isValid => title.trim().isNotEmpty && amount > 0;

  factory EntryDraft.blank() => EntryDraft(
        type: TxType.expense,
        title: '',
        amount: 0,
        category: Category.other,
        date: today(),
      );

  /// Parses one entry of the voice route's `entries` array.
  factory EntryDraft.fromVoice(Map<String, dynamic> raw) => EntryDraft(
        type: txTypeFrom(raw['type']),
        title: '${raw['title'] ?? ''}'.trim(),
        amount: double.tryParse('${raw['amount']}') ?? 0,
        category: categoryFrom(raw['category']),
        date: parseDay(raw['date']),
        items: ReceiptItem.listFrom(raw['items']),
        confident: raw['confident'] != false,
      );

  static DateTime today() {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day);
  }

  static DateTime parseDay(Object? raw) {
    final parsed = raw is String ? DateTime.tryParse(raw.trim()) : null;
    return parsed == null ? today() : DateTime(parsed.year, parsed.month, parsed.day);
  }
}

/// Same modal configuration for every AI entry sheet.
Future<T?> showAiSheet<T>(BuildContext context, WidgetBuilder builder) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    enableDrag: false,
    backgroundColor: Colors.transparent,
    builder: builder,
  );
}

/// Rounded sheet card with a centered title and a close button.
class AiSheetFrame extends StatelessWidget {
  const AiSheetFrame({super.key, required this.title, required this.child, this.closeLabel, this.onClose});
  final String title;
  final Widget child;
  final String? closeLabel;
  final VoidCallback? onClose;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final media = MediaQuery.of(context);
    return Container(
      constraints: BoxConstraints(maxHeight: media.size.height * 0.92),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: EdgeInsets.only(bottom: media.viewInsets.bottom),
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(20, 12, 20, 20 + media.padding.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const SizedBox(width: 40),
                Expanded(
                  child: Text(
                    title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: -0.3),
                  ),
                ),
                SizedBox.square(
                  dimension: 40,
                  child: onClose == null
                      ? null
                      : IconButton(
                          tooltip: closeLabel,
                          onPressed: onClose,
                          style: IconButton.styleFrom(backgroundColor: colors.surface),
                          icon: Icon(Icons.close_rounded, size: 20, color: colors.muted),
                        ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            child,
          ],
        ),
      ),
    );
  }
}

/// Lets the user correct a suspect read before anything is saved.
class ConfirmEntryForm extends ConsumerStatefulWidget {
  const ConfirmEntryForm({
    super.key,
    required this.entries,
    required this.onSave,
    this.heard,
    this.photo,
    this.notice,
    this.onRetry,
  });

  final List<EntryDraft> entries;
  final Future<void> Function(List<EntryDraft> entries) onSave;
  final String? heard;
  final Uint8List? photo;
  final String? notice;
  final VoidCallback? onRetry;

  @override
  ConsumerState<ConfirmEntryForm> createState() => _ConfirmEntryFormState();
}

class _ConfirmEntryFormState extends ConsumerState<ConfirmEntryForm> {
  late final List<EntryDraft> _entries = [...widget.entries];
  bool _saving = false;

  bool get _valid => _entries.isNotEmpty && _entries.every((e) => e.isValid);

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    setState(() => _saving = true);
    try {
      await widget.onSave(_entries);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(aiEntryStrings);
    final colors = context.colors;
    final heard = widget.heard?.trim() ?? '';
    final saveLabel = _entries.length > 1 ? t.saveCount(_entries.length) : t.save;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.notice != null) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: colors.accentOrange.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline_rounded, size: 18, color: colors.accentOrange),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(widget.notice!, style: TextStyle(fontSize: 13, color: colors.accentOrange)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (widget.photo != null) ...[
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Image.memory(widget.photo!, height: 140, fit: BoxFit.cover),
          ),
          const SizedBox(height: 12),
        ],
        if (heard.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(16)),
            child: Text(
              '“$heard”',
              style: TextStyle(fontSize: 14, fontStyle: FontStyle.italic, color: colors.muted),
            ),
          ),
          const SizedBox(height: 12),
        ],
        for (final entry in _entries) ...[
          _EntryCard(
            key: ObjectKey(entry),
            entry: entry,
            onChanged: () => setState(() {}),
            onRemove: _entries.length > 1 ? () => setState(() => _entries.remove(entry)) : null,
          ),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 4),
        Row(
          children: [
            if (widget.onRetry != null) ...[
              Expanded(
                child: FilledButton(
                  onPressed: _saving ? null : widget.onRetry,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(52),
                    backgroundColor: colors.surface,
                    foregroundColor: Theme.of(context).colorScheme.onSurface,
                  ),
                  child: Text(t.sayAgain),
                ),
              ),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: FilledButton(
                onPressed: _saving || !_valid ? null : _save,
                child: _saving
                    ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(saveLabel),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _EntryCard extends ConsumerStatefulWidget {
  const _EntryCard({super.key, required this.entry, required this.onChanged, this.onRemove});
  final EntryDraft entry;
  final VoidCallback onChanged;
  final VoidCallback? onRemove;

  @override
  ConsumerState<_EntryCard> createState() => _EntryCardState();
}

class _EntryCardState extends ConsumerState<_EntryCard> {
  late final _title = TextEditingController(text: widget.entry.title);
  late final _amount = TextEditingController(text: _formatAmount(widget.entry.amount));

  static String _formatAmount(double amount) {
    if (amount <= 0) return '';
    return amount == amount.roundToDouble() ? amount.toInt().toString() : amount.toString();
  }

  @override
  void dispose() {
    _title.dispose();
    _amount.dispose();
    super.dispose();
  }

  void _update(void Function(EntryDraft entry) change) {
    setState(() => change(widget.entry));
    widget.onChanged();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: widget.entry.date,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) _update((e) => e.date = picked);
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(aiEntryStrings);
    final labels = ref.tr(categoryLabels);
    final locale = ref.watch(localeProvider);
    final colors = context.colors;
    final background = Theme.of(context).scaffoldBackgroundColor;
    final entry = widget.entry;
    final isExpense = entry.type == TxType.expense;
    final accent = isExpense ? colors.accentOrange : colors.success;
    final categories = isExpense ? expenseCategories : incomeCategories;
    final needsAmount = !(entry.amount > 0);
    final fieldDecoration = InputDecoration(fillColor: background);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: needsAmount ? colors.accentOrange.withValues(alpha: 0.6) : Colors.transparent,
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(16)),
                  child: Row(
                    children: [
                      for (final (type, label) in [(TxType.expense, t.expense), (TxType.income, t.income)])
                        Expanded(
                          child: GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onTap: () => _update((e) {
                              e.type = type;
                              final allowed = type == TxType.expense ? expenseCategories : incomeCategories;
                              if (!allowed.contains(e.category)) e.category = Category.other;
                            }),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 180),
                              height: 34,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: entry.type == type ? colors.surface2 : Colors.transparent,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                label,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: entry.type == type ? null : colors.muted,
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              if (widget.onRemove != null) ...[
                const SizedBox(width: 8),
                IconButton(
                  tooltip: t.removeEntry,
                  onPressed: widget.onRemove,
                  style: IconButton.styleFrom(backgroundColor: background, fixedSize: const Size.square(40)),
                  icon: Icon(Icons.close_rounded, size: 18, color: colors.muted),
                ),
              ],
            ],
          ),
          if (entry.items.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  for (final (i, item) in entry.items.indexed)
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        border: i == 0 ? null : Border(top: BorderSide(color: colors.border)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${item.quantity > 1 ? '${item.quantity} × ' : ''}${item.name}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 14),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            money(item.total),
                            style: TextStyle(
                              fontSize: 14,
                              color: colors.muted,
                              fontFeatures: const [FontFeature.tabularFigures()],
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 8),
          TextField(
            controller: _title,
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.next,
            onChanged: (v) => _update((e) => e.title = v),
            decoration: fieldDecoration.copyWith(hintText: t.titlePlaceholder),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _amount,
            autofocus: needsAmount && entry.title.isNotEmpty,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))],
            onChanged: (v) => _update((e) => e.amount = double.tryParse(v.replaceAll(',', '')) ?? 0),
            decoration: fieldDecoration.copyWith(hintText: t.amountPlaceholder, prefixText: '₮ '),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: categories.length,
              separatorBuilder: (_, _) => const SizedBox(width: 6),
              itemBuilder: (context, i) {
                final category = categories[i];
                final selected = category == entry.category;
                return GestureDetector(
                  onTap: () => _update((e) => e.category = category),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.fromLTRB(4, 4, 12, 4),
                    decoration: BoxDecoration(
                      color: selected ? accent.withValues(alpha: 0.14) : background,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: selected ? accent : Colors.transparent, width: 1.5),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 26,
                          height: 26,
                          decoration: BoxDecoration(color: colors.surface2, shape: BoxShape.circle),
                          alignment: Alignment.center,
                          child: Image.asset(category.asset, width: 16, height: 16),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          labels[category] ?? '',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: selected ? accent : null),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 4),
          InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: _pickDate,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              child: Row(
                children: [
                  Icon(Icons.calendar_today_rounded, size: 14, color: colors.muted),
                  const SizedBox(width: 6),
                  Text(
                    '${t.date} · ${DateFormat.yMMMd(intlLocale[locale]).format(entry.date)}',
                    style: TextStyle(fontSize: 12, color: colors.muted),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

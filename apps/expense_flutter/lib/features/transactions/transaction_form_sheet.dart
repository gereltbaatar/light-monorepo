import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/categories.dart';
import '../../core/i18n.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import 'transactions_strings.dart';

/// Opens the add form, or the edit form when [existing] is given.
Future<void> showTransactionForm(BuildContext context, {Transaction? existing}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    backgroundColor: Theme.of(context).scaffoldBackgroundColor,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
    builder: (_) => _TransactionForm(existing: existing),
  );
}

class _TransactionForm extends ConsumerStatefulWidget {
  const _TransactionForm({this.existing});
  final Transaction? existing;

  @override
  ConsumerState<_TransactionForm> createState() => _TransactionFormState();
}

class _TransactionFormState extends ConsumerState<_TransactionForm> {
  late TxType _type = widget.existing?.type ?? TxType.expense;
  late final _title = TextEditingController(text: widget.existing?.title ?? '');
  late final _amount = TextEditingController(text: _initialAmount());
  late DateTime _date = widget.existing?.occurredAt ?? _today();
  late Category _category = widget.existing?.category ?? Category.other;
  String? _titleError;
  String? _amountError;
  bool _saving = false;

  bool get _isEdit => widget.existing != null;

  static DateTime _today() {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day);
  }

  String _initialAmount() {
    final amount = widget.existing?.amount;
    if (amount == null) return '';
    return amount == amount.roundToDouble() ? amount.toInt().toString() : amount.toString();
  }

  @override
  void dispose() {
    _title.dispose();
    _amount.dispose();
    super.dispose();
  }

  List<Category> get _categories => _type == TxType.expense ? expenseCategories : incomeCategories;

  void _setType(TxType type) {
    setState(() {
      _type = type;
      if (!_categories.contains(_category)) _category = Category.other;
    });
  }

  bool _validate(FormStrings t) {
    final raw = _amount.text.trim().replaceAll(',', '');
    final parsed = double.tryParse(raw);
    setState(() {
      _titleError = _title.text.trim().isEmpty ? t.titleRequired : null;
      _amountError = raw.isEmpty
          ? t.amountRequired
          : (parsed == null || !parsed.isFinite || parsed <= 0)
              ? t.amountPositive
              : null;
    });
    return _titleError == null && _amountError == null;
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _submit(FormStrings t) async {
    FocusScope.of(context).unfocus();
    if (!_validate(t)) return;
    setState(() => _saving = true);
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    final repo = ref.read(repositoryProvider);
    final version = ref.read(dataVersionProvider.notifier);
    final amount = double.parse(_amount.text.trim().replaceAll(',', ''));
    try {
      if (_isEdit) {
        await repo.update(
          widget.existing!.id,
          type: _type,
          title: _title.text,
          amount: amount,
          occurredAt: _date,
          category: _category,
        );
      } else {
        await repo.add(type: _type, title: _title.text, amount: amount, occurredAt: _date, category: _category);
      }
    } catch (e) {
      if (mounted) setState(() => _saving = false);
      messenger.showSnackBar(SnackBar(content: Text('${t.couldNotSave}: $e')));
      return;
    }
    version.bump();
    if (mounted) navigator.pop();
    final message = _isEdit ? t.updated : (_type == TxType.expense ? t.expenseSaved : t.incomeSaved);
    messenger.showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(formStrings);
    final colors = context.colors;
    final locale = ref.watch(localeProvider);
    final labels = ref.tr(categoryLabels);
    final isExpense = _type == TxType.expense;
    final accent = isExpense ? colors.accentOrange : colors.success;
    final labelStyle = TextStyle(fontSize: 14, color: colors.muted);
    final saveLabel = _isEdit ? t.save : (isExpense ? t.saveExpense : t.saveIncome);

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _isEdit ? t.editTransaction : t.addTransaction,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 20),
            _TypeSwitch(type: _type, onChanged: _setType, expenseLabel: t.expense, incomeLabel: t.income),
            const SizedBox(height: 16),
            Text(t.title, style: labelStyle),
            const SizedBox(height: 8),
            TextField(
              controller: _title,
              textCapitalization: TextCapitalization.sentences,
              textInputAction: TextInputAction.next,
              onChanged: (_) => _titleError == null ? null : setState(() => _titleError = null),
              decoration: InputDecoration(
                hintText: isExpense ? t.expensePlaceholder : t.incomePlaceholder,
                errorText: _titleError,
              ),
            ),
            const SizedBox(height: 16),
            Text(t.amount, style: labelStyle),
            const SizedBox(height: 8),
            TextField(
              controller: _amount,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))],
              onChanged: (_) => _amountError == null ? null : setState(() => _amountError = null),
              decoration: InputDecoration(hintText: '0', prefixText: '₮ ', errorText: _amountError),
            ),
            const SizedBox(height: 16),
            Text(t.date, style: labelStyle),
            const SizedBox(height: 8),
            Material(
              color: colors.surface,
              borderRadius: BorderRadius.circular(16),
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: _pickDate,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          DateFormat.yMMMMd(intlLocale[locale]).format(_date),
                          style: const TextStyle(fontSize: 16),
                        ),
                      ),
                      Icon(Icons.calendar_today_rounded, size: 18, color: colors.muted),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(t.category, style: labelStyle),
            const SizedBox(height: 8),
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final category = _categories[i];
                  final selected = category == _category;
                  return GestureDetector(
                    onTap: () => setState(() => _category = category),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.fromLTRB(6, 6, 14, 6),
                      decoration: BoxDecoration(
                        color: selected ? accent.withValues(alpha: 0.14) : colors.surface,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: selected ? accent : Colors.transparent, width: 1.5),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 30,
                            height: 30,
                            decoration: BoxDecoration(color: colors.surface2, shape: BoxShape.circle),
                            alignment: Alignment.center,
                            child: Image.asset(category.asset, width: 18, height: 18),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            labels[category] ?? '',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: selected ? accent : null,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),
            DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                boxShadow: [
                  BoxShadow(color: accent.withValues(alpha: 0.5), blurRadius: 24, offset: const Offset(0, 8), spreadRadius: -8),
                ],
              ),
              child: FilledButton(
                onPressed: _saving ? null : () => _submit(t),
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(58),
                  backgroundColor: accent,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: accent.withValues(alpha: 0.6),
                  disabledForegroundColor: Colors.white,
                  textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                ),
                child: _saving
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          ),
                          const SizedBox(width: 8),
                          Text(t.saving),
                        ],
                      )
                    : Text(saveLabel),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypeSwitch extends StatelessWidget {
  const _TypeSwitch({
    required this.type,
    required this.onChanged,
    required this.expenseLabel,
    required this.incomeLabel,
  });
  final TxType type;
  final ValueChanged<TxType> onChanged;
  final String expenseLabel;
  final String incomeLabel;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isExpense = type == TxType.expense;

    Widget tab(TxType value, IconData icon, String label, Color tone) {
      final active = type == value;
      final color = active ? tone : colors.muted;
      return Expanded(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => onChanged(value),
          child: SizedBox(
            height: 48,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 16, color: color),
                const SizedBox(width: 8),
                Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: color)),
              ],
            ),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: colors.surface2, borderRadius: BorderRadius.circular(20)),
      child: Stack(
        children: [
          AnimatedAlign(
            duration: const Duration(milliseconds: 260),
            curve: Curves.easeOutBack,
            alignment: isExpense ? Alignment.centerLeft : Alignment.centerRight,
            child: FractionallySizedBox(
              widthFactor: 0.5,
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.15) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: isDark
                      ? null
                      : const [BoxShadow(color: Color(0x1F000000), blurRadius: 10, offset: Offset(0, 2), spreadRadius: -2)],
                ),
              ),
            ),
          ),
          Row(
            children: [
              tab(TxType.expense, Icons.north_east_rounded, expenseLabel, colors.accentOrange),
              tab(TxType.income, Icons.south_west_rounded, incomeLabel, colors.success),
            ],
          ),
        ],
      ),
    );
  }
}

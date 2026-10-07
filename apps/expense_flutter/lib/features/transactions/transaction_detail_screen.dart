import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/categories.dart';
import '../../core/i18n.dart';
import '../../core/money.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import 'transaction_form_sheet.dart';
import 'transactions_strings.dart';
import 'widgets/transaction_tile.dart';

class TransactionDetailScreen extends ConsumerWidget {
  const TransactionDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(txStrings);
    final async = ref.watch(transactionProvider(id));
    final tx = async.value;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: t.back,
          icon: const Icon(Icons.chevron_left_rounded, size: 32),
          onPressed: () => context.canPop() ? context.pop() : context.go('/transactions'),
        ),
        title: Text(t.details, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
        actions: [
          if (tx != null)
            IconButton(
              tooltip: t.editTransaction,
              icon: const Icon(Icons.edit_outlined, size: 22),
              onPressed: () => showTransactionForm(context, existing: tx),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: async.when(
        data: (tx) => tx == null
            ? Center(child: Text(t.notFound, style: TextStyle(color: context.colors.muted)))
            : _DetailBody(tx: tx),
        loading: () => const Center(child: CircularProgressIndicator.adaptive()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('${t.loadFailed}: $e', textAlign: TextAlign.center),
          ),
        ),
      ),
    );
  }
}

class _DetailBody extends ConsumerStatefulWidget {
  const _DetailBody({required this.tx});
  final Transaction tx;

  @override
  ConsumerState<_DetailBody> createState() => _DetailBodyState();
}

class _DetailBodyState extends ConsumerState<_DetailBody> {
  bool _deleting = false;

  Future<void> _delete() async {
    final tx = widget.tx;
    if (!await confirmDeleteTransaction(context, ref, tx.title)) return;
    if (!mounted) return;
    final t = ref.read(localeProvider) == AppLocale.mn ? txStrings.mn : txStrings.en;
    final messenger = ScaffoldMessenger.of(context);
    final router = GoRouter.of(context);
    final version = ref.read(dataVersionProvider.notifier);
    setState(() => _deleting = true);
    try {
      await ref.read(repositoryProvider).delete(tx.id);
    } catch (e) {
      if (mounted) setState(() => _deleting = false);
      messenger.showSnackBar(SnackBar(content: Text('$e')));
      return;
    }
    router.canPop() ? router.pop() : router.go('/transactions');
    messenger.showSnackBar(SnackBar(content: Text(t.deleted)));
    version.bump();
  }

  @override
  Widget build(BuildContext context) {
    final tx = widget.tx;
    final t = ref.tr(txStrings);
    final locale = intlLocale[ref.watch(localeProvider)];
    final colors = context.colors;
    final accent = tx.isIncome ? colors.income : colors.expense;
    final categoryLabel = ref.tr(categoryLabels)[tx.category] ?? '';

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
      children: [
        Column(
          children: [
            CategoryBadge(category: tx.category, size: 72),
            const SizedBox(height: 12),
            Text(
              tx.title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                '${tx.isIncome ? '+' : '-'} ${money(tx.amount)}',
                style: TextStyle(fontSize: 36, fontWeight: FontWeight.w700, color: accent),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(color: colors.surface2, borderRadius: BorderRadius.circular(999)),
              child: Text(
                categoryLabel.toUpperCase(),
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5, color: colors.muted),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        _Card(
          children: [
            _Row(label: t.type, value: tx.isIncome ? t.income : t.expense),
            _Row(label: t.date, value: DateFormat.yMMMMEEEEd(locale).format(tx.occurredAt)),
            _Row(label: t.added, value: DateFormat.yMMMd(locale).add_Hm().format(tx.createdAt)),
          ],
        ),
        if (tx.items.isNotEmpty) ...[
          const SizedBox(height: 24),
          _ReceiptItems(tx: tx),
        ],
        if (tx.receiptUrl != null && tx.receiptUrl!.isNotEmpty) ...[
          const SizedBox(height: 24),
          _Label(t.receipt),
          GestureDetector(
            onTap: () => _openImage(context, tx.receiptUrl!),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: ColoredBox(
                color: colors.surface,
                child: CachedNetworkImage(
                  imageUrl: tx.receiptUrl!,
                  fit: BoxFit.fitWidth,
                  width: double.infinity,
                  placeholder: (_, _) => const SizedBox(
                    height: 240,
                    child: Center(child: CircularProgressIndicator.adaptive()),
                  ),
                  errorWidget: (_, _, _) => SizedBox(
                    height: 120,
                    child: Icon(Icons.broken_image_outlined, color: colors.muted),
                  ),
                ),
              ),
            ),
          ),
        ],
        const SizedBox(height: 24),
        SizedBox(
          height: 54,
          child: FilledButton.icon(
            onPressed: _deleting ? null : _delete,
            style: FilledButton.styleFrom(
              backgroundColor: colors.expenseSoft,
              foregroundColor: colors.expense,
              disabledBackgroundColor: colors.expenseSoft,
              disabledForegroundColor: colors.expense.withValues(alpha: 0.6),
            ),
            icon: _deleting
                ? SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: colors.expense),
                  )
                : const Icon(Icons.delete_outline_rounded, size: 20),
            label: Text(t.deleteTransaction),
          ),
        ),
      ],
    );
  }

  void _openImage(BuildContext context, String url) {
    showDialog<void>(
      context: context,
      barrierColor: Colors.black87,
      builder: (context) => GestureDetector(
        onTap: () => Navigator.pop(context),
        child: InteractiveViewer(child: Center(child: CachedNetworkImage(imageUrl: url))),
      ),
    );
  }
}

class _ReceiptItems extends ConsumerWidget {
  const _ReceiptItems({required this.tx});
  final Transaction tx;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(txStrings);
    final colors = context.colors;
    final itemsSum = tx.items.fold<num>(0, (sum, item) => sum + item.total);
    final reconciles = itemsSum.round() == tx.amount.round();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Label(t.items(tx.items.length)),
        _Card(
          children: [
            for (final item in tx.items)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 2),
                          Text(
                            '${_qty(item.quantity)} × ${money(item.unitPrice)}',
                            style: TextStyle(fontSize: 12, color: colors.muted),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Text(money(item.total), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            _Row(
              label: t.itemsTotal,
              value: money(itemsSum),
              valueStyle: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: reconciles ? null : colors.accentOrange,
              ),
            ),
          ],
        ),
        if (!reconciles) ...[
          const SizedBox(height: 8),
          Text(
            t.itemsMismatch(money(itemsSum), money(tx.amount)),
            style: TextStyle(fontSize: 12, color: colors.accentOrange),
          ),
        ],
      ],
    );
  }

  String _qty(num q) => q == q.roundToDouble() ? q.toInt().toString() : q.toString();
}

class _Card extends StatelessWidget {
  const _Card({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: isDark ? Border.all(color: colors.border) : null,
      ),
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

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value, this.valueStyle});
  final String label;
  final String value;
  final TextStyle? valueStyle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          Text(label, style: TextStyle(fontSize: 14, color: context.colors.muted)),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: valueStyle ?? const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: TextStyle(fontSize: 14, color: context.colors.muted)),
    );
  }
}

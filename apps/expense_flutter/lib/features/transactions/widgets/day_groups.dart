import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/i18n.dart';
import '../../../core/settings.dart';
import '../../../core/theme.dart';
import '../../../data/models.dart';
import '../../../data/repository.dart';
import '../transactions_strings.dart';
import 'transaction_tile.dart';

String dayLabel(DateTime day, AppLocale locale) {
  final t = locale == AppLocale.mn ? homeStrings.mn : homeStrings.en;
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final diff = today.difference(DateTime(day.year, day.month, day.day)).inHours / 24;
  if (diff.round() == 0) return t.today;
  if (diff.round() == 1) return t.yesterday;
  return DateFormat.yMMMMd(intlLocale[locale]).format(day);
}

/// Groups keep input order, so newest-first lists stay newest-first.
List<({String label, List<Transaction> items})> groupByDay(List<Transaction> txs, AppLocale locale) {
  final groups = <({String label, List<Transaction> items})>[];
  for (final tx in txs) {
    final label = dayLabel(tx.occurredAt, locale);
    if (groups.isNotEmpty && groups.last.label == label) {
      groups.last.items.add(tx);
    } else {
      groups.add((label: label, items: [tx]));
    }
  }
  return groups;
}

// Hides dismissed rows until the reload lands, as Dismissible requires.
class DayGroupedTransactions extends ConsumerStatefulWidget {
  const DayGroupedTransactions({super.key, required this.transactions});
  final List<Transaction> transactions;

  @override
  ConsumerState<DayGroupedTransactions> createState() => _DayGroupedTransactionsState();
}

class _DayGroupedTransactionsState extends ConsumerState<DayGroupedTransactions> {
  final _removed = <String>{};

  Future<void> _delete(Transaction tx) async {
    setState(() => _removed.add(tx.id));
    final messenger = ScaffoldMessenger.of(context);
    final t = ref.read(localeProvider) == AppLocale.mn ? txStrings.mn : txStrings.en;
    final version = ref.read(dataVersionProvider.notifier);
    try {
      await ref.read(repositoryProvider).delete(tx.id);
      messenger.showSnackBar(SnackBar(content: Text(t.deleted)));
    } catch (e) {
      if (mounted) setState(() => _removed.remove(tx.id));
      messenger.showSnackBar(SnackBar(content: Text('$e')));
    }
    version.bump();
  }

  @override
  Widget build(BuildContext context) {
    final locale = ref.watch(localeProvider);
    final visible = widget.transactions.where((tx) => !_removed.contains(tx.id)).toList();
    final groups = groupByDay(visible, locale);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var g = 0; g < groups.length; g++) ...[
          if (g > 0) const SizedBox(height: 24),
          Text(
            groups[g].label.toUpperCase(),
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
              color: context.colors.muted,
            ),
          ),
          const SizedBox(height: 12),
          for (final tx in groups[g].items) ...[
            TransactionTile(tx: tx, onDeleted: () => _delete(tx)),
            const SizedBox(height: 12),
          ],
        ],
      ],
    );
  }
}

class EmptyTransactions extends StatelessWidget {
  const EmptyTransactions({super.key, required this.title, required this.hint, this.filled = false});
  final String title;
  final String hint;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      decoration: BoxDecoration(
        color: filled ? colors.surface : null,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.muted.withValues(alpha: 0.35)),
      ),
      child: Column(
        children: [
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(hint, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: colors.muted)),
        ],
      ),
    );
  }
}

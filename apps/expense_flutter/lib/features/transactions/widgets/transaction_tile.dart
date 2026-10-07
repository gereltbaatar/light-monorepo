import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/categories.dart';
import '../../../core/i18n.dart';
import '../../../core/money.dart';
import '../../../core/settings.dart';
import '../../../core/theme.dart';
import '../../../data/models.dart';
import '../transactions_strings.dart';

Future<bool> confirmDeleteTransaction(BuildContext context, WidgetRef ref, String title) async {
  final t = ref.read(localeProvider) == AppLocale.mn ? txStrings.mn : txStrings.en;
  final colors = context.colors;
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      title: Text(t.confirmDelete(title)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.cancel)),
        TextButton(
          onPressed: () => Navigator.pop(context, true),
          child: Text(t.delete, style: TextStyle(color: colors.expense, fontWeight: FontWeight.w600)),
        ),
      ],
    ),
  );
  return result ?? false;
}

class CategoryBadge extends StatelessWidget {
  const CategoryBadge({super.key, required this.category, this.size = 48});
  final Category category;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: context.colors.surface2, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: Image.asset(category.asset, width: size * 0.54, height: size * 0.54, fit: BoxFit.contain),
    );
  }
}

class TransactionTile extends ConsumerWidget {
  const TransactionTile({super.key, required this.tx, required this.onDeleted});
  final Transaction tx;
  final VoidCallback onDeleted;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.colors;
    final label = ref.tr(categoryLabels)[tx.category] ?? '';
    final amountColor = tx.isIncome ? colors.income : colors.expense;

    return Dismissible(
      key: ValueKey(tx.id),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) => confirmDeleteTransaction(context, ref, tx.title),
      onDismissed: (_) => onDeleted(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        decoration: BoxDecoration(color: colors.expenseSoft, borderRadius: BorderRadius.circular(999)),
        child: Icon(Icons.delete_outline_rounded, color: colors.expense),
      ),
      child: Material(
        color: colors.surface,
        shape: const StadiumBorder(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.push('/transactions/${tx.id}'),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 20, 8),
            child: Row(
              children: [
                CategoryBadge(category: tx.category),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tx.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, height: 1.2),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: colors.surface2,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          label.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                            color: colors.muted,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${tx.isIncome ? '+' : '-'}${money(tx.amount)}',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: amountColor,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

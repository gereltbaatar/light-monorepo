import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/repository.dart';
import 'transactions_strings.dart';
import 'widgets/day_groups.dart';

class AllTransactionsScreen extends ConsumerWidget {
  const AllTransactionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(txStrings);
    final all = ref.watch(allTransactionsProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: t.back,
          icon: const Icon(Icons.chevron_left_rounded, size: 32),
          onPressed: () => context.canPop() ? context.pop() : context.go('/'),
        ),
        title: Text(t.allTransactions, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.read(dataVersionProvider.notifier).bump();
          try {
            await ref.read(allTransactionsProvider.future);
          } catch (_) {
            // The error state renders below.
          }
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
          children: [
            all.when(
              data: (txs) => txs.isEmpty
                  ? EmptyTransactions(title: t.emptyTitle, hint: t.emptyHint, filled: true)
                  : DayGroupedTransactions(transactions: txs),
              loading: () => const Padding(
                padding: EdgeInsets.all(48),
                child: Center(child: CircularProgressIndicator.adaptive()),
              ),
              error: (e, _) => Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  '${t.loadFailed}: $e',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: context.colors.expense),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../core/money.dart';
import '../../core/theme.dart';
import '../../data/goals_repository.dart';
import '../../data/repository.dart';
import '../goals/goal_card.dart';
import '../transactions/transactions_strings.dart';
import '../transactions/widgets/day_groups.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref.read(dataVersionProvider.notifier).bump();
    try {
      await Future.wait([
        ref.read(recentTransactionsProvider.future),
        ref.read(balanceProvider.future),
      ]);
    } catch (_) {
      // Errors surface in the sections themselves.
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => _refresh(ref),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 110),
            children: const [
              _Header(),
              _TotalBalance(),
              _Goals(),
              _RecentTransactions(),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends ConsumerStatefulWidget {
  const _Header();

  @override
  ConsumerState<_Header> createState() => _HeaderState();
}

class _HeaderState extends ConsumerState<_Header> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(minutes: 5), (_) => setState(() {}));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _greeting(HomeStrings t) {
    final hour = DateTime.now().hour;
    if (hour < 5) return t.night;
    if (hour < 12) return t.morning;
    if (hour < 17) return t.afternoon;
    if (hour < 21) return t.evening;
    return t.night;
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(homeStrings);
    final colors = context.colors;
    final profile = ref.watch(profileProvider).value;
    final avatar = profile?.avatarUrl;
    const nameStyle = TextStyle(fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.5, height: 1.25);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_greeting(t), style: nameStyle.copyWith(color: colors.muted)),
                Text(profile?.name ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: nameStyle),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => context.go('/profile'),
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(color: colors.surface2, shape: BoxShape.circle),
              clipBehavior: Clip.antiAlias,
              child: avatar == null || avatar.isEmpty
                  ? Icon(Icons.person_rounded, size: 30, color: colors.muted)
                  : CachedNetworkImage(
                      imageUrl: avatar,
                      fit: BoxFit.cover,
                      errorWidget: (_, _, _) => Icon(Icons.person_rounded, size: 30, color: colors.muted),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TotalBalance extends ConsumerWidget {
  const _TotalBalance();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(homeStrings);
    final colors = context.colors;
    final balance = ref.watch(balanceProvider).value;
    final income = balance?.income ?? 0;
    final expense = balance?.expense ?? 0;
    final net = income - expense;
    final savedPercent = income > 0 ? (net / income * 100).round() : null;
    final trendColor = net >= 0 ? colors.income : colors.expense;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t.totalBalance,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: colors.muted),
                ),
                const SizedBox(height: 8),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    balance == null ? '—' : money(net),
                    style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w700, letterSpacing: -0.5),
                  ),
                ),
                const SizedBox(height: 12),
                if (savedPercent != null)
                  Row(
                    children: [
                      Text(net >= 0 ? '▲' : '▼', style: TextStyle(fontSize: 13, color: trendColor)),
                      const SizedBox(width: 6),
                      Text(
                        t.percentOfIncome(savedPercent),
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: trendColor),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          IntrinsicWidth(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _MiniCard(icon: Icons.trending_up_rounded, label: t.income, value: income, color: colors.income),
                const SizedBox(height: 12),
                _MiniCard(icon: Icons.trending_down_rounded, label: t.expense, value: expense, color: colors.expense),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniCard extends StatelessWidget {
  const _MiniCard({required this.icon, required this.label, required this.value, required this.color});
  final IconData icon;
  final String label;
  final double value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: context.colors.surface, borderRadius: BorderRadius.circular(16)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: color)),
              Text(money(value), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: color)),
            ],
          ),
        ],
      ),
    );
  }
}

class _Goals extends ConsumerWidget {
  const _Goals();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goals = ref.watch(goalsProvider).value ?? const <Goal>[];
    return SizedBox(
      height: 252,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        itemCount: goals.length + 1,
        separatorBuilder: (_, _) => const SizedBox(width: 16),
        itemBuilder: (_, i) => i < goals.length ? GoalCard(goal: goals[i]) : const AddGoalCard(),
      ),
    );
  }
}

class _RecentTransactions extends ConsumerWidget {
  const _RecentTransactions();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(homeStrings);
    final recent = ref.watch(recentTransactionsProvider);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(t.transactions, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
              ),
              GestureDetector(
                onTap: () => context.push('/transactions'),
                child: Text(t.seeAll, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          recent.when(
            data: (txs) => txs.isEmpty
                ? EmptyTransactions(title: t.emptyTitle, hint: t.emptyHint)
                : DayGroupedTransactions(transactions: txs),
            loading: () => const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator.adaptive()),
            ),
            error: (e, _) => Padding(
              padding: const EdgeInsets.all(24),
              child: Text('$e', textAlign: TextAlign.center, style: TextStyle(color: context.colors.expense)),
            ),
          ),
        ],
      ),
    );
  }
}

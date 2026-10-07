import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/i18n.dart';
import '../../core/money.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../../data/goals_repository.dart';
import '../../data/repository.dart';
import 'goal_card.dart';
import 'goals_strings.dart';

class GoalDetailScreen extends ConsumerWidget {
  const GoalDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(goalsStrings);
    final async = ref.watch(goalProvider(id));

    return async.when(
      data: (goal) => goal == null
          ? _Message(text: t.errors.notFound, backLabel: t.back)
          : _GoalDetailBody(goal: goal),
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator.adaptive())),
      error: (e, _) => _Message(text: '${t.loadFailed}: $e', backLabel: t.back),
    );
  }
}

void _goBack(BuildContext context) => context.canPop() ? context.pop() : context.go('/');

class _Message extends StatelessWidget {
  const _Message({required this.text, required this.backLabel});
  final String text;
  final String backLabel;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: backLabel,
          icon: const Icon(Icons.chevron_left_rounded, size: 32),
          onPressed: () => _goBack(context),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(text, textAlign: TextAlign.center, style: TextStyle(color: context.colors.muted)),
        ),
      ),
    );
  }
}

class _GoalDetailBody extends ConsumerStatefulWidget {
  const _GoalDetailBody({required this.goal});
  final Goal goal;

  @override
  ConsumerState<_GoalDetailBody> createState() => _GoalDetailBodyState();
}

class _GoalDetailBodyState extends ConsumerState<_GoalDetailBody> {
  bool _deleting = false;

  GoalsStrings get _t => ref.read(localeProvider) == AppLocale.mn ? goalsStrings.mn : goalsStrings.en;

  Future<void> _contribute(ContributionDirection direction) async {
    final goal = widget.goal;
    final saved = await showDialog<bool>(
      context: context,
      builder: (_) => _ContributionDialog(goal: goal, direction: direction),
    );
    if (saved != true || !mounted) return;
    final t = _t;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(direction == ContributionDirection.deposit ? t.addedToGoal : t.withdrawnFromGoal)),
    );
  }

  Future<void> _delete() async {
    final t = _t;
    final colors = context.colors;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(t.deleteConfirmTitle(widget.goal.title)),
        content: Text(t.deleteConfirmBody, style: TextStyle(color: colors.muted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: Text(t.cancel)),
          FilledButton(
            style: FilledButton.styleFrom(
              minimumSize: const Size(0, 44),
              backgroundColor: colors.expense,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(t.delete),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    final router = GoRouter.of(context);
    final version = ref.read(dataVersionProvider.notifier);
    setState(() => _deleting = true);
    try {
      await ref.read(goalsRepositoryProvider).deleteGoal(widget.goal.id);
    } catch (e) {
      if (mounted) setState(() => _deleting = false);
      messenger.showSnackBar(SnackBar(content: Text('$e')));
      return;
    }
    router.canPop() ? router.pop() : router.go('/');
    messenger.showSnackBar(SnackBar(content: Text(t.goalDeleted)));
    version.bump();
  }

  @override
  Widget build(BuildContext context) {
    final goal = widget.goal;
    final t = ref.tr(goalsStrings);
    final colors = context.colors;
    final foreground = Theme.of(context).colorScheme.onSurface;
    final dateFormat = DateFormat.yMMMd(intlLocale[ref.watch(localeProvider)]);
    final contributions = ref.watch(goalContributionsProvider(goal.id));
    final topInset = MediaQuery.paddingOf(context).top;
    final period = goal.contributionPeriod;
    final infoRows = <Widget>[
      if (goal.targetDate != null) _InfoRow(label: t.targetDate, value: dateFormat.format(goal.targetDate!)),
      if (goal.kind == GoalKind.plan && goal.contributionAmount != null && period != null)
        _InfoRow(
          label: t.plan,
          value: '${money(goal.contributionAmount!)} / ${t.periodUnit[period.name] ?? period.name}',
        ),
      if (goal.kind == GoalKind.plan && goal.startDate != null)
        _InfoRow(label: t.started, value: dateFormat.format(goal.startDate!)),
    ];

    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.only(bottom: 110),
        children: [
          SizedBox(
            height: 260 + topInset,
            child: Stack(
              fit: StackFit.expand,
              children: [
                GoalCover(imageUrl: goal.imageUrl, iconSize: 64),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [Color(0x99000000), Color(0x1A000000), Color(0x00000000)],
                    ),
                  ),
                ),
                Positioned(
                  left: 16,
                  top: topInset + 16,
                  child: Material(
                    color: Colors.white.withValues(alpha: 0.9),
                    shape: const CircleBorder(),
                    child: IconButton(
                      tooltip: t.back,
                      constraints: const BoxConstraints.tightFor(width: 40, height: 40),
                      padding: EdgeInsets.zero,
                      icon: const Icon(Icons.chevron_left_rounded, size: 26, color: Colors.black),
                      onPressed: () => _goBack(context),
                    ),
                  ),
                ),
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          _Badge(
                            label: goal.kind == GoalKind.plan
                                ? t.plan
                                : (t.categories[goal.category.name] ?? goal.category.name),
                            background: colors.surface2,
                            foreground: foreground,
                          ),
                          if (goal.status == GoalStatus.completed) ...[
                            const SizedBox(width: 8),
                            _Badge(label: t.completed, background: colors.success, foreground: Colors.white),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        goal.title,
                        style: const TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.5,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _SurfaceCard(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(t.saved, style: TextStyle(fontSize: 14, color: colors.muted)),
                                  FittedBox(
                                    fit: BoxFit.scaleDown,
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      money(goal.savedAmount),
                                      style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w700),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text('${goal.percent}%', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        GoalProgressBar(percent: goal.percent, height: 10),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                t.target(money(goal.targetAmount)),
                                style: TextStyle(fontSize: 14, color: colors.muted),
                              ),
                            ),
                            Text(t.toGo(money(goal.remaining)), style: TextStyle(fontSize: 14, color: colors.muted)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                        onPressed: () => _contribute(ContributionDirection.deposit),
                        icon: const Icon(Icons.add_rounded, size: 18),
                        label: Text(t.addMoney),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton.icon(
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          backgroundColor: colors.surface2,
                          foregroundColor: foreground,
                          disabledBackgroundColor: colors.surface2.withValues(alpha: 0.5),
                        ),
                        onPressed: goal.savedAmount <= 0 ? null : () => _contribute(ContributionDirection.withdrawal),
                        icon: const Icon(Icons.remove_rounded, size: 18),
                        label: Text(t.withdraw),
                      ),
                    ),
                  ],
                ),
                if (infoRows.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  _SurfaceCard(child: _Divided(children: infoRows)),
                ],
                const SizedBox(height: 20),
                Text(t.history, style: TextStyle(fontSize: 14, color: colors.muted)),
                const SizedBox(height: 8),
                contributions.when(
                  data: (items) => items.isEmpty
                      ? Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: colors.border),
                          ),
                          child: Text(
                            t.noContributions,
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 14, color: colors.muted),
                          ),
                        )
                      : _SurfaceCard(
                          child: _Divided(
                            children: [
                              for (final c in items) _ContributionRow(contribution: c, t: t, dateFormat: dateFormat),
                            ],
                          ),
                        ),
                  loading: () => const Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(child: CircularProgressIndicator.adaptive()),
                  ),
                  error: (e, _) => Text('$e', style: TextStyle(color: colors.expense)),
                ),
                const SizedBox(height: 20),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                    backgroundColor: colors.expenseSoft,
                    foregroundColor: colors.expense,
                    disabledBackgroundColor: colors.expenseSoft,
                  ),
                  onPressed: _deleting ? null : _delete,
                  icon: _deleting
                      ? SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: colors.expense),
                        )
                      : const Icon(Icons.delete_outline_rounded, size: 18),
                  label: Text(t.deleteGoal),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.background, required this.foreground});
  final String label;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: foreground)),
    );
  }
}

class _SurfaceCard extends StatelessWidget {
  const _SurfaceCard({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? colors.border : Colors.transparent),
      ),
      clipBehavior: Clip.antiAlias,
      child: child,
    );
  }
}

class _Divided extends StatelessWidget {
  const _Divided({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var i = 0; i < children.length; i++) ...[
          if (i > 0) const Divider(),
          children[i],
        ],
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});
  final String label;
  final String value;

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
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _ContributionRow extends StatelessWidget {
  const _ContributionRow({required this.contribution, required this.t, required this.dateFormat});
  final GoalContribution contribution;
  final GoalsStrings t;
  final DateFormat dateFormat;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final c = contribution;
    final note = c.note ?? '';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  note.isNotEmpty ? note : (c.isDeposit ? t.deposit : t.withdrawal),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                Text(dateFormat.format(c.contributedOn), style: TextStyle(fontSize: 12, color: colors.muted)),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Text(
            '${c.isDeposit ? '+' : '-'} ${money(c.amount)}',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: c.isDeposit ? colors.income : colors.expense,
            ),
          ),
        ],
      ),
    );
  }
}

class _ContributionDialog extends ConsumerStatefulWidget {
  const _ContributionDialog({required this.goal, required this.direction});
  final Goal goal;
  final ContributionDirection direction;

  @override
  ConsumerState<_ContributionDialog> createState() => _ContributionDialogState();
}

class _ContributionDialogState extends ConsumerState<_ContributionDialog> {
  final _amount = TextEditingController();
  final _note = TextEditingController();
  bool _saving = false;
  String? _error;

  bool get _isWithdrawal => widget.direction == ContributionDirection.withdrawal;

  @override
  void dispose() {
    _amount.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final navigator = Navigator.of(context);
    final version = ref.read(dataVersionProvider.notifier);
    final amount = double.tryParse(_amount.text.trim().replaceAll(',', '').replaceAll(' ', '')) ?? 0;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref
          .read(goalsRepositoryProvider)
          .addContribution(widget.goal.id, amount: amount, direction: widget.direction, note: _note.text);
    } catch (e) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = '$e';
        });
      }
      return;
    }
    version.bump();
    navigator.pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(goalsStrings);
    final colors = context.colors;
    final labelStyle = TextStyle(fontSize: 14, color: colors.muted);
    final hint = widget.goal.contributionAmount;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: Text(_isWithdrawal ? t.withdrawTitle : t.depositTitle),
      content: SizedBox(
        width: 360,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(t.amount, style: labelStyle),
            const SizedBox(height: 8),
            TextField(
              controller: _amount,
              autofocus: true,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(hintText: hint == null ? '100000' : hint.round().toString()),
            ),
            const SizedBox(height: 16),
            Text(t.noteOptional, style: labelStyle),
            const SizedBox(height: 8),
            TextField(
              controller: _note,
              maxLength: 120,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(hintText: t.notePlaceholder, counterText: ''),
              onSubmitted: (_) => _saving ? null : _submit(),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(fontSize: 13, color: colors.expense)),
            ],
            const SizedBox(height: 20),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              onPressed: _saving ? null : _submit,
              child: _saving
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: colors.muted),
                    )
                  : Text(_isWithdrawal ? t.withdraw : t.add),
            ),
          ],
        ),
      ),
    );
  }
}

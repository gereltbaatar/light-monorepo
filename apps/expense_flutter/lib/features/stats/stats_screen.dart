import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/categories.dart';
import '../../core/i18n.dart';
import '../../core/money.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import 'stats_data.dart';
import 'stats_strings.dart';
import 'widgets/category_donut.dart';
import 'widgets/trend_card.dart';

final _compact = NumberFormat.compact(locale: 'en_US')
  ..significantDigitsInUse = false
  ..maximumFractionDigits = 1
  ..minimumFractionDigits = 0;

String _capitalize(String text) => text.isEmpty ? text : text[0].toUpperCase() + text.substring(1);

class StatsScreen extends ConsumerStatefulWidget {
  const StatsScreen({super.key});

  @override
  ConsumerState<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends ConsumerState<StatsScreen> {
  StatsPeriod _period = StatsPeriod.month;

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(statsStrings);
    final stats = ref.watch(statsProvider(_period));
    final fg = Theme.of(context).colorScheme.onSurface;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 430),
            child: RefreshIndicator(
              onRefresh: () => ref.refresh(periodRowsProvider(_period).future),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 32, 16, 110),
                children: [
                  Text(
                    t.statistics,
                    style: TextStyle(fontSize: 30, fontWeight: FontWeight.w700, letterSpacing: -0.6, color: fg),
                  ),
                  const SizedBox(height: 16),
                  _PeriodSwitch(
                    value: _period,
                    labelOf: t.period,
                    onChanged: (p) => setState(() => _period = p),
                  ),
                  const SizedBox(height: 16),
                  ...switch (stats) {
                    AsyncData(:final value) => _content(value, t),
                    AsyncError() => [
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 48),
                          child: Text(
                            '${stats.error}',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: context.colors.muted),
                          ),
                        ),
                      ],
                    _ => [
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 64),
                          child: Center(child: CircularProgressIndicator.adaptive()),
                        ),
                      ],
                  },
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _content(SpendingStats stats, StatsStrings t) {
    final colors = context.colors;
    final fg = Theme.of(context).colorScheme.onSurface;
    final locale = ref.watch(localeProvider);
    final categoryNames = ref.tr(categoryLabels);

    if (stats.count == 0) return [_EmptyState(title: t.noData, hint: t.noDataHint)];

    TrendChange? change(int? percent, bool goodWhenUp) => percent == null || percent == 0
        ? null
        : TrendChange(text: t.vsPrevious(percent.abs()), up: percent > 0, good: (percent > 0) == goodWhenUp);

    final dateFormat = DateFormat.MMMd(intlLocale[locale]);
    const gap = SizedBox(height: 16);

    return [
      TrendCard(
        key: ValueKey(_period),
        labels: [for (final p in stats.series) _capitalize(t.through(p.label))],
        ticks: [for (final p in stats.series) p.tick],
        income: TrendSeries(
          label: t.income,
          color: colors.income,
          values: [for (final p in stats.series) p.income],
          change: change(stats.earnedChangePercent, true),
        ),
        expense: TrendSeries(
          label: t.expense,
          color: colors.expense,
          values: [for (final p in stats.series) p.expense],
          change: change(stats.spentChangePercent, false),
        ),
        netLabel: t.net,
      ),
      gap,
      Row(
        children: [
          Expanded(
            child: _Figure(
              label: t.dailyAverage,
              value: money(stats.spent / daysElapsed(_period, DateTime.now())),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: _Figure(label: t.transactions, value: '${stats.count}')),
        ],
      ),
      gap,
      _Card(
        title: t.byCategory,
        child: stats.byCategory.isEmpty
            ? Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text(
                  t.noExpensesInPeriod,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: colors.muted),
                ),
              )
            : Column(
                children: [
                  CategoryDonut(
                    slices: stats.byCategory,
                    labels: categoryNames,
                    centerValue: '₮${_compact.format(stats.spent)}',
                    centerLabel: t.spent,
                  ),
                  const SizedBox(height: 24),
                  _CategoryGrid(slices: stats.byCategory, labels: categoryNames),
                ],
              ),
      ),
      if (stats.topExpenses.isNotEmpty) ...[
        gap,
        _Card(
          title: t.topExpenses,
          child: Column(
            children: [
              for (var i = 0; i < stats.topExpenses.length; i++) ...[
                if (i > 0) const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: Theme.of(context).scaffoldBackgroundColor,
                        shape: BoxShape.circle,
                      ),
                      child: Image.asset(stats.topExpenses[i].category.asset, width: 28, height: 28),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            stats.topExpenses[i].title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: fg),
                          ),
                          Text(
                            '${categoryNames[stats.topExpenses[i].category]} · '
                            '${dateFormat.format(stats.topExpenses[i].occurredAt)}',
                            style: TextStyle(fontSize: 12, color: colors.muted),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      money(stats.topExpenses[i].amount),
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: fg),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    ];
  }
}

class _PeriodSwitch extends StatelessWidget {
  const _PeriodSwitch({required this.value, required this.labelOf, required this.onChanged});

  final StatsPeriod value;
  final String Function(StatsPeriod) labelOf;
  final ValueChanged<StatsPeriod> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          for (final p in StatsPeriod.values) ...[
            if (p.index > 0) const SizedBox(width: 4),
            Expanded(
              child: Semantics(
                button: true,
                selected: p == value,
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => onChanged(p),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: p == value ? theme.scaffoldBackgroundColor : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      labelOf(p),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: p == value ? theme.colorScheme.onSurface : colors.muted,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({this.title, required this.child});

  final String? title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (title != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                title!.toUpperCase(),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.6,
                  color: colors.muted,
                ),
              ),
            ),
          child,
        ],
      ),
    );
  }
}

class _Figure extends StatelessWidget {
  const _Figure({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => _Card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 14, color: context.colors.muted)),
            const SizedBox(height: 4),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
          ],
        ),
      );
}

class _CategoryGrid extends StatelessWidget {
  const _CategoryGrid({required this.slices, required this.labels});

  final List<CategorySlice> slices;
  final Map<Category, String> labels;

  @override
  Widget build(BuildContext context) {
    final rows = [
      for (var i = 0; i < slices.length; i += 2) slices.sublist(i, i + 2 > slices.length ? slices.length : i + 2),
    ];
    return Column(
      children: [
        for (var r = 0; r < rows.length; r++) ...[
          if (r > 0) const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: _CategoryTile(slice: rows[r][0], label: labels[rows[r][0].category] ?? '')),
              const SizedBox(width: 10),
              Expanded(
                child: rows[r].length > 1
                    ? _CategoryTile(slice: rows[r][1], label: labels[rows[r][1].category] ?? '')
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({required this.slice, required this.label});

  final CategorySlice slice;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.colors;
    final fg = theme.colorScheme.onSurface;
    final dot = categoryColors(dark: theme.brightness == Brightness.dark)[slice.category] ?? colors.muted;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Image.asset(slice.category.asset, width: 36, height: 36, fit: BoxFit.contain),
              const Spacer(),
              Text(
                '${slice.percent}%',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: fg),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            money(slice.amount),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: fg),
          ),
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(color: dot, shape: BoxShape.circle),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12, color: colors.muted),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.title, required this.hint});

  final String title;
  final String hint;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return CustomPaint(
      painter: _DashedBorderPainter(color: colors.border),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
        decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(24)),
        child: Column(
          children: [
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 4),
            Text(hint, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: colors.muted)),
          ],
        ),
      ),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  _DashedBorderPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final outline = Path()
      ..addRRect(RRect.fromRectAndRadius((Offset.zero & size).deflate(0.5), const Radius.circular(24)));
    for (final metric in outline.computeMetrics()) {
      for (var d = 0.0; d < metric.length; d += 9) {
        canvas.drawPath(metric.extractPath(d, d + 5), paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DashedBorderPainter old) => old.color != color;
}

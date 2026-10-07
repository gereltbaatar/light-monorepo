import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/categories.dart';
import '../../core/i18n.dart';
import '../../core/money.dart';
import '../../core/theme.dart';
import '../../data/ai_api.dart';
import 'advisor_providers.dart';
import 'advisor_strings.dart';
import 'spending_summary.dart';

const _red = Color(0xFFEF4444);
const _orange = Color(0xFFF97316);
const _blue = Color(0xFF3B82F6);

Color _green(BuildContext context) =>
    Theme.of(context).brightness == Brightness.dark ? const Color(0xFF22C55E) : const Color(0xFF16A34A);

String errorText(Object error, AdvisorStrings t) => error is AiApiException ? error.message : t.chatFailed;

class _Card extends StatelessWidget {
  const _Card({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: context.colors.surface, borderRadius: BorderRadius.circular(24)),
        child: child,
      );
}

class SpendingStats extends ConsumerWidget {
  const SpendingStats({super.key, required this.summary});
  final SpendingSummary summary;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(advisorStrings);
    final labels = ref.tr(categoryLabels);
    final colors = context.colors;
    final top = summary.byCategory.isEmpty ? null : summary.byCategory.first;
    final change = summary.changePercent;
    final muted14 = TextStyle(fontSize: 14, color: colors.muted);
    const tabular = [FontFeature.tabularFigures()];

    return Column(
      children: [
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _Card(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t.thisMonth, style: muted14),
                      const SizedBox(height: 4),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          money(summary.monthSpent),
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, fontFeatures: tabular),
                        ),
                      ),
                      if (change != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          '${change > 0 ? '▲' : '▼'} ${t.vsLastMonth(change.abs())}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: change > 0 ? _red : _green(context),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _Card(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t.topCategory, style: muted14),
                      const SizedBox(height: 4),
                      if (top == null)
                        Text(t.noExpenses, style: muted14)
                      else
                        Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(color: colors.surface2, shape: BoxShape.circle),
                              child: Image.asset(top.category.asset, width: 22, height: 22, fit: BoxFit.contain),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    labels[top.category]!,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                                  ),
                                  Text(
                                    t.shareOfSpending(top.share),
                                    style: TextStyle(fontSize: 12, color: colors.muted),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        if (summary.byCategory.isNotEmpty) ...[
          const SizedBox(height: 12),
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.whereMoneyGoes, style: muted14),
                for (final c in summary.byCategory.take(5)) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          labels[c.category]!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                      ),
                      Text(
                        '${money(c.amount)} · ${c.share}%',
                        style: muted14.copyWith(fontFeatures: tabular),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: Container(
                      height: 8,
                      color: colors.surface2,
                      alignment: Alignment.centerLeft,
                      child: FractionallySizedBox(
                        widthFactor: (c.share < 2 ? 2 : c.share) / 100,
                        heightFactor: 1,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.onSurface,
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
        if (summary.topMerchants.isNotEmpty) ...[
          const SizedBox(height: 12),
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(t.topPlaces, style: muted14)),
                for (var i = 0; i < summary.topMerchants.length; i++) ...[
                  if (i > 0) const Divider(),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                summary.topMerchants[i].title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                              ),
                              Text(
                                t.visits(summary.topMerchants[i].count),
                                style: TextStyle(fontSize: 12, color: colors.muted),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          '-${money(summary.topMerchants[i].amount)}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: _red,
                            fontFeatures: tabular,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class AdviceSection extends ConsumerWidget {
  const AdviceSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(advisorStrings);
    final colors = context.colors;
    return switch (ref.watch(adviceProvider)) {
      AsyncData(:final value) => _Card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.auto_awesome_rounded, size: 16, color: _blue),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(value.headline, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              for (final insight in value.insights) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: colors.surface2, borderRadius: BorderRadius.circular(16)),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: switch (insight.tone) {
                          'good' => Icon(Icons.check_circle_outline_rounded, size: 16, color: _green(context)),
                          'warn' => const Icon(Icons.warning_amber_rounded, size: 16, color: _orange),
                          _ => const Icon(Icons.auto_awesome_rounded, size: 16, color: _blue),
                        },
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(insight.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 2),
                            Text(insight.detail, style: TextStyle(fontSize: 14, color: colors.muted)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      AsyncError(:final error) => _Card(
          child: Text(errorText(error, t), style: TextStyle(fontSize: 14, color: colors.muted)),
        ),
      _ => _Card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Pulse(child: Icon(Icons.auto_awesome_rounded, size: 16, color: _blue)),
                  const SizedBox(width: 8),
                  Text(t.analyzing, style: TextStyle(fontSize: 14, color: colors.muted)),
                ],
              ),
              for (var i = 0; i < 3; i++) ...[
                const SizedBox(height: 12),
                Pulse(
                  child: Container(
                    height: 64,
                    decoration: BoxDecoration(color: colors.surface2, borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ],
            ],
          ),
        ),
    };
  }
}

class QuestionsSection extends ConsumerWidget {
  const QuestionsSection({super.key, required this.onAsk, required this.busy});

  final ValueChanged<String> onAsk;
  final bool busy;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(advisorStrings);
    final colors = context.colors;
    const padding = EdgeInsets.symmetric(horizontal: 16);

    return switch (ref.watch(questionsProvider)) {
      AsyncData(:final value) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: padding,
              child: Text(
                value.fromSearch ? t.trendingQuestions : t.popularQuestions,
                style: TextStyle(fontSize: 12, color: colors.muted),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 42,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: padding,
                itemCount: value.questions.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, i) => _Chip(
                  label: value.questions[i],
                  onTap: busy ? null : () => onAsk(value.questions[i]),
                ),
              ),
            ),
          ],
        ),
      AsyncError(:final error) => Padding(
          padding: padding,
          child: Text(errorText(error, t), style: TextStyle(fontSize: 14, color: colors.muted)),
        ),
      _ => SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            physics: const NeverScrollableScrollPhysics(),
            padding: padding,
            children: [
              for (final w in const [140.0, 180.0, 120.0])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Pulse(
                    child: Container(
                      width: w,
                      decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(999)),
                    ),
                  ),
                ),
            ],
          ),
        ),
    };
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.onTap});
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Opacity(
      opacity: onTap == null ? 0.6 : 1,
      child: Material(
        color: colors.surface,
        shape: const StadiumBorder(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          highlightColor: colors.surface2,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Center(
              widthFactor: 1,
              child: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
            ),
          ),
        ),
      ),
    );
  }
}

/// Fades its child in and out like Tailwind's animate-pulse.
class Pulse extends StatefulWidget {
  const Pulse({super.key, required this.child});
  final Widget child;

  @override
  State<Pulse> createState() => _PulseState();
}

class _PulseState extends State<Pulse> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1000),
    lowerBound: 0.5,
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(opacity: _controller, child: widget.child);
}

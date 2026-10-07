import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../core/money.dart';
import '../../core/theme.dart';
import '../../data/goals_repository.dart';
import 'goals_strings.dart';

class GoalProgressBar extends StatelessWidget {
  const GoalProgressBar({super.key, required this.percent, this.height = 6});
  final int percent;
  final double height;

  @override
  Widget build(BuildContext context) {
    final foreground = Theme.of(context).colorScheme.onSurface;
    return ClipRRect(
      borderRadius: BorderRadius.circular(height),
      child: LinearProgressIndicator(
        value: percent / 100,
        minHeight: height,
        backgroundColor: foreground.withValues(alpha: 0.1),
        color: foreground,
      ),
    );
  }
}

class GoalCover extends StatelessWidget {
  const GoalCover({super.key, required this.imageUrl, this.iconSize = 32});
  final String? imageUrl;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final placeholder = ColoredBox(
      color: colors.surface2,
      child: Center(child: Icon(Icons.savings_outlined, size: iconSize, color: colors.muted)),
    );
    final url = imageUrl;
    if (url == null || url.isEmpty) return placeholder;
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      placeholder: (_, _) => placeholder,
      errorWidget: (_, _, _) => placeholder,
    );
  }
}

class GoalCard extends ConsumerWidget {
  const GoalCard({super.key, required this.goal});
  final Goal goal;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(goalsStrings);
    final colors = context.colors;

    return GestureDetector(
      onTap: () => context.push('/goals/${goal.id}'),
      child: Container(
        width: 155,
        height: 220,
        decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(24)),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: 92,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  GoalCover(imageUrl: goal.imageUrl),
                  if (goal.status == GoalStatus.completed)
                    Positioned(
                      left: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF00A86B),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          t.done,
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.white),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      goal.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: -0.3),
                    ),
                    const SizedBox(height: 2),
                    Text('${goal.percent}%', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
                    const Spacer(),
                    GoalProgressBar(percent: goal.percent),
                    const SizedBox(height: 6),
                    Text(
                      '${money(goal.savedAmount)} / ${money(goal.targetAmount)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 11, color: colors.muted),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AddGoalCard extends ConsumerWidget {
  const AddGoalCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(goalsStrings);
    final colors = context.colors;
    final foreground = Theme.of(context).colorScheme.onSurface;

    return Semantics(
      button: true,
      label: t.addNewGoal,
      child: GestureDetector(
        onTap: () => context.push('/goals/new'),
        child: CustomPaint(
          painter: _DashedBorderPainter(color: colors.muted.withValues(alpha: 0.5), radius: 24),
          child: SizedBox(
            width: 155,
            height: 220,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.add_rounded, size: 28, color: foreground),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    t.addNewGoal,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: colors.muted),
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

class _DashedBorderPainter extends CustomPainter {
  const _DashedBorderPainter({required this.color, required this.radius});
  final Color color;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    final rrect = RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius)).deflate(1);
    final path = Path()..addRRect(rrect);
    for (final metric in path.computeMetrics()) {
      for (double d = 0; d < metric.length; d += 10) {
        canvas.drawPath(metric.extractPath(d, d + 6), paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DashedBorderPainter old) => old.color != color || old.radius != radius;
}

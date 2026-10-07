import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/categories.dart';
import '../../../core/theme.dart';
import '../stats_data.dart';

const _size = 220.0;
const _stroke = 22.0;
const _radius = (_size - _stroke) / 2;
const _circumference = 2 * math.pi * _radius;
// Gap must also cover the round caps on both ends.
const _gap = _stroke + 8;
const _minShare = _gap + 2;

class CategoryDonut extends StatelessWidget {
  const CategoryDonut({
    super.key,
    required this.slices,
    required this.labels,
    required this.centerValue,
    required this.centerLabel,
  });

  final List<CategorySlice> slices;
  final Map<Category, String> labels;
  final String centerValue;
  final String centerLabel;

  @override
  Widget build(BuildContext context) {
    final palette = categoryColors(dark: Theme.of(context).brightness == Brightness.dark);
    final total = slices.fold(0.0, (sum, s) => sum + s.amount);
    final ordered = [
      for (final key in expenseCategories) ...slices.where((s) => s.category == key && s.amount > 0),
    ];

    final single = ordered.length == 1;
    final raw = [for (final s in ordered) s.amount / total * _circumference];
    final smallCount = raw.where((r) => r < _minShare).length;
    final largeTotal = raw.where((r) => r >= _minShare).fold(0.0, (a, b) => a + b);
    final scale = largeTotal > 0 ? (_circumference - smallCount * _minShare) / largeTotal : 1.0;
    final shares = [for (final r in raw) r < _minShare ? _minShare : r * scale];

    final arcs = <_Arc>[];
    var before = 0.0;
    for (var i = 0; i < ordered.length; i++) {
      arcs.add((
        color: palette[ordered[i].category] ?? palette[Category.other]!,
        length: single ? _circumference : math.max(shares[i] - _gap, 0.001),
        start: single ? 0.0 : before + _gap / 2,
      ));
      before += shares[i];
    }

    return Semantics(
      label: [
        for (final s in ordered) '${labels[s.category]}: ${(s.amount / total * 100).round()}%',
      ].join(', '),
      child: SizedBox.square(
        dimension: _size,
        child: CustomPaint(
          painter: _DonutPainter(arcs: arcs, round: arcs.length > 1),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  centerValue,
                  style: TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.6,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                Text(centerLabel, style: TextStyle(fontSize: 14, color: context.colors.muted)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

typedef _Arc = ({Color color, double length, double start});

class _DonutPainter extends CustomPainter {
  _DonutPainter({required this.arcs, required this.round});

  final List<_Arc> arcs;
  final bool round;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromCircle(center: size.center(Offset.zero), radius: _radius);
    for (final arc in arcs) {
      final paint = Paint()
        ..color = arc.color
        ..style = PaintingStyle.stroke
        ..strokeWidth = _stroke
        ..strokeCap = round ? StrokeCap.round : StrokeCap.butt;
      final sweep = arc.length / _radius;
      if (sweep >= 2 * math.pi - 1e-6) {
        canvas.drawCircle(rect.center, _radius, paint);
      } else {
        canvas.drawArc(rect, -math.pi / 2 + arc.start / _radius, sweep, false, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DonutPainter old) => old.arcs != arcs || old.round != round;
}

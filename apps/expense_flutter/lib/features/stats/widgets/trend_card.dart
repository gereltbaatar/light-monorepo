import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/money.dart';
import '../../../core/theme.dart';

const _maxLabels = 12;
const _denseLabels = 6;
const _chartHeight = 144.0;

class TrendChange {
  const TrendChange({required this.text, required this.up, required this.good});

  final String text;
  final bool up;
  final bool good;
}

class TrendSeries {
  const TrendSeries({required this.label, required this.color, required this.values, this.change});

  final String label;
  final Color color;
  final List<double> values;

  /// Shown only while the period's end is selected.
  final TrendChange? change;
}

List<double> _runningTotal(List<double> values) {
  var sum = 0.0;
  return [for (final v in values) sum += v];
}

class TrendCard extends StatefulWidget {
  const TrendCard({
    super.key,
    required this.labels,
    required this.ticks,
    required this.income,
    required this.expense,
    required this.netLabel,
  });

  final List<String> labels;
  final List<String> ticks;
  final TrendSeries income;
  final TrendSeries expense;
  final String netLabel;

  @override
  State<TrendCard> createState() => _TrendCardState();
}

class _TrendCardState extends State<TrendCard> {
  late int _picked = widget.labels.length - 1;

  void _pick(double dx, double width) {
    final last = widget.labels.length - 1;
    final ratio = (dx / width).clamp(0.0, 1.0);
    final index = (ratio * last).round();
    if (index != _picked) setState(() => _picked = index);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final fg = Theme.of(context).colorScheme.onSurface;
    final last = widget.labels.length - 1;
    final selected = math.min(_picked, last);
    final incomeTotals = _runningTotal(widget.income.values);
    final expenseTotals = _runningTotal(widget.expense.values);
    final atEnd = selected == last;
    final net = incomeTotals[selected] - expenseTotals[selected];

    return Container(
      decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(24)),
      padding: const EdgeInsets.only(top: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              widget.labels[selected],
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: colors.muted),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _Figure(series: widget.income, total: incomeTotals[selected], showChange: atEnd)),
                const SizedBox(width: 12),
                Expanded(child: _Figure(series: widget.expense, total: expenseTotals[selected], showChange: atEnd)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final width = constraints.maxWidth;
                return GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTapDown: (d) => _pick(d.localPosition.dx, width),
                  onHorizontalDragStart: (d) => _pick(d.localPosition.dx, width),
                  onHorizontalDragUpdate: (d) => _pick(d.localPosition.dx, width),
                  child: Semantics(
                    label: '${widget.income.label} ${money(incomeTotals[last])}, '
                        '${widget.expense.label} ${money(expenseTotals[last])}',
                    child: SizedBox(
                      height: _chartHeight,
                      width: double.infinity,
                      child: CustomPaint(
                        painter: _TrendPainter(
                          lines: [
                            (color: widget.income.color, totals: incomeTotals),
                            (color: widget.expense.color, totals: expenseTotals),
                          ],
                          selected: selected,
                          cursorColor: fg.withValues(alpha: 0.2),
                          ringColor: colors.surface,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: SizedBox(height: 32, child: _Ticks(ticks: widget.ticks, selected: selected)),
          ),
          DecoratedBox(
            decoration: BoxDecoration(border: Border(top: BorderSide(color: colors.border))),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              child: Row(
                children: [
                  Text(widget.netLabel, style: TextStyle(fontSize: 14, color: colors.muted)),
                  const Spacer(),
                  Text(
                    '${net < 0 ? '−' : ''}${money(net.abs())}',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: fg),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Figure extends StatelessWidget {
  const _Figure({required this.series, required this.total, required this.showChange});

  final TrendSeries series;
  final double total;
  final bool showChange;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final change = series.change;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(color: series.color, shape: BoxShape.circle),
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(series.label, style: TextStyle(fontSize: 14, color: colors.muted)),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          money(total),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
        if (showChange && change != null)
          Builder(builder: (context) {
            final color = change.good ? colors.income : colors.expense;
            return Row(
              children: [
                Text(change.up ? '▲' : '▼', style: TextStyle(fontSize: 9, color: color)),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    change.text,
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color),
                  ),
                ),
              ],
            );
          }),
      ],
    );
  }
}

// Counted back from today so the latest point keeps a label.
class _Ticks extends StatelessWidget {
  const _Ticks({required this.ticks, required this.selected});

  final List<String> ticks;
  final int selected;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final fg = Theme.of(context).colorScheme.onSurface;
    final last = ticks.length - 1;
    final step = ticks.length > _maxLabels ? (ticks.length / _denseLabels).ceil() : 1;

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        return Stack(
          clipBehavior: Clip.none,
          children: [
            for (var i = 0; i <= last; i++)
              if ((last - i) % step == 0)
                Builder(builder: (context) {
                  final ratio = last > 0 ? i / last : 1.0;
                  final label = Text(
                    ticks[i],
                    maxLines: 1,
                    softWrap: false,
                    style: TextStyle(
                      fontSize: 11,
                      fontFeatures: const [FontFeature.tabularFigures()],
                      fontWeight: i == selected ? FontWeight.w600 : FontWeight.w400,
                      color: i == selected ? fg : colors.muted,
                    ),
                  );
                  if (ratio == 0) return Positioned(left: 0, top: 8, child: label);
                  if (ratio == 1) return Positioned(right: 0, top: 8, child: label);
                  return Positioned(
                    left: ratio * width,
                    top: 8,
                    child: FractionalTranslation(translation: const Offset(-0.5, 0), child: label),
                  );
                }),
          ],
        );
      },
    );
  }
}

typedef _Line = ({Color color, List<double> totals});

class _TrendPainter extends CustomPainter {
  _TrendPainter({
    required this.lines,
    required this.selected,
    required this.cursorColor,
    required this.ringColor,
  });

  final List<_Line> lines;
  final int selected;
  final Color cursorColor;
  final Color ringColor;

  // One shared scale keeps both running totals comparable.
  List<Offset> _points(List<double> totals, double max, Size size) {
    final series = totals.length == 1 ? [totals[0], totals[0]] : totals;
    final top = size.height * 0.1;
    return [
      for (var i = 0; i < series.length; i++)
        Offset(
          i / (series.length - 1) * size.width,
          max > 0 ? size.height - series[i] / max * (size.height - top) : size.height - 1,
        ),
    ];
  }

  // Monotone cubic (Fritsch–Carlson) so the curve never overshoots.
  Path _smooth(List<Offset> p) {
    final n = p.length;
    final slopes = [for (var i = 0; i < n - 1; i++) (p[i + 1].dy - p[i].dy) / (p[i + 1].dx - p[i].dx)];
    final tangents = [
      for (var i = 0; i < n; i++)
        if (i == 0)
          slopes[0]
        else if (i == n - 1)
          slopes[n - 2]
        else if (slopes[i - 1] * slopes[i] <= 0)
          0.0
        else
          2 * slopes[i - 1] * slopes[i] / (slopes[i - 1] + slopes[i]),
    ];
    final path = Path()..moveTo(p[0].dx, p[0].dy);
    for (var i = 0; i < n - 1; i++) {
      final dx = (p[i + 1].dx - p[i].dx) / 3;
      path.cubicTo(
        p[i].dx + dx,
        p[i].dy + tangents[i] * dx,
        p[i + 1].dx - dx,
        p[i + 1].dy - tangents[i + 1] * dx,
        p[i + 1].dx,
        p[i + 1].dy,
      );
    }
    return path;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final max = lines.expand((l) => l.totals).fold(0.0, math.max);
    final count = lines.first.totals.length;
    final points = [for (final line in lines) _points(line.totals, max, size)];
    final curves = [for (final p in points) _smooth(p)];

    for (var i = 0; i < lines.length; i++) {
      final fill = Path.from(curves[i])
        ..lineTo(size.width, size.height)
        ..lineTo(0, size.height)
        ..close();
      final bounds = fill.getBounds();
      canvas.drawPath(
        fill,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [lines[i].color.withValues(alpha: 0.28), lines[i].color.withValues(alpha: 0)],
          ).createShader(bounds),
      );
    }
    for (var i = 0; i < lines.length; i++) {
      canvas.drawPath(
        curves[i],
        Paint()
          ..color = lines[i].color
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2
          ..strokeJoin = StrokeJoin.round,
      );
    }

    final x = count > 1 ? selected / (count - 1) * size.width : size.width;
    canvas.drawLine(Offset(x, 0), Offset(x, size.height), Paint()..color = cursorColor);

    for (var i = 0; i < lines.length; i++) {
      final y = points[i][count == 1 ? 1 : selected].dy;
      canvas.drawCircle(Offset(x, y), 8, Paint()..color = ringColor);
      canvas.drawCircle(Offset(x, y), 6, Paint()..color = lines[i].color);
    }
  }

  @override
  bool shouldRepaint(_TrendPainter old) =>
      old.selected != selected ||
      old.lines != lines ||
      old.cursorColor != cursorColor ||
      old.ringColor != ringColor;
}

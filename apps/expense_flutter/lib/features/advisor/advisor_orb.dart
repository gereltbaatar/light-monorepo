import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

/// Flutter take on the web's siri-sheet VoiceOrb: drifting blurred blobs.
class AdvisorOrb extends StatefulWidget {
  const AdvisorOrb({super.key, this.thinking = false, this.disabled = false, this.size = 144});

  final bool thinking;
  final bool disabled;
  final double size;

  @override
  State<AdvisorOrb> createState() => _AdvisorOrbState();
}

class _AdvisorOrbState extends State<AdvisorOrb> with SingleTickerProviderStateMixin {
  late final Ticker _ticker = createTicker(_tick);
  final _frame = ValueNotifier<_OrbFrame>(const _OrbFrame(0, 0));
  Duration _last = Duration.zero;

  void _tick(Duration elapsed) {
    final dt = (elapsed - _last).inMicroseconds / 1e6;
    _last = elapsed;
    final speed = widget.thinking ? 2.6 : 1.0;
    final target = widget.thinking ? 1.0 : 0.0;
    final f = _frame.value;
    _frame.value = _OrbFrame(f.phase + dt * speed, f.pulse + (target - f.pulse) * math.min(1, dt * 4));
  }

  void _sync() {
    final animate = !widget.disabled && !(MediaQuery.maybeDisableAnimationsOf(context) ?? false);
    if (animate && !_ticker.isActive) {
      _last = Duration.zero;
      _ticker.start();
    } else if (!animate && _ticker.isActive) {
      _ticker.stop();
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _sync();
  }

  @override
  void didUpdateWidget(AdvisorOrb oldWidget) {
    super.didUpdateWidget(oldWidget);
    _sync();
  }

  @override
  void dispose() {
    _ticker.dispose();
    _frame.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SizedBox.square(
      dimension: widget.size,
      child: RepaintBoundary(
        child: CustomPaint(
          painter: _OrbPainter(_frame, disabled: widget.disabled, isDark: isDark),
        ),
      ),
    );
  }
}

@immutable
class _OrbFrame {
  const _OrbFrame(this.phase, this.pulse);
  final double phase;
  final double pulse;
}

class _OrbPainter extends CustomPainter {
  _OrbPainter(this.frame, {required this.disabled, required this.isDark}) : super(repaint: frame);

  final ValueNotifier<_OrbFrame> frame;
  final bool disabled;
  final bool isDark;

  static const _from = Color(0xFF82F4FF);
  static const _to = Color(0xFF8E6CFF);
  static const _blobs = [
    (color: Color(0xFF82F4FF), orbit: 0.30, size: 0.62, speed: 0.55, offset: 0.0),
    (color: Color(0xFF8E6CFF), orbit: 0.34, size: 0.66, speed: -0.42, offset: 2.1),
    (color: Color(0xFFF472B6), orbit: 0.28, size: 0.48, speed: 0.71, offset: 4.0),
    (color: Color(0xFF60A5FA), orbit: 0.22, size: 0.52, speed: -0.63, offset: 5.3),
  ];

  Color _tint(Color c) {
    if (!disabled) return c;
    final grey = isDark ? const Color(0xFF6B7280) : const Color(0xFFA1A1AA);
    return Color.lerp(c, grey, 0.92)!;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final f = frame.value;
    final center = size.center(Offset.zero);
    final scale = 1 + f.pulse * 0.06 * math.sin(f.phase * 4.2);
    final radius = size.shortestSide / 2 * 0.86 * scale;
    final rect = Rect.fromCircle(center: center, radius: radius);

    if (!disabled) {
      canvas.drawCircle(
        center,
        radius * (1.02 + f.pulse * 0.06),
        Paint()
          ..color = _to.withValues(alpha: 0.35 + f.pulse * 0.2)
          ..maskFilter = MaskFilter.blur(BlurStyle.normal, radius * 0.35),
      );
    }

    canvas.save();
    canvas.clipPath(Path()..addOval(rect));
    canvas.drawRect(
      rect,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [_tint(_from), _tint(_to)],
        ).createShader(rect),
    );
    for (final b in _blobs) {
      final angle = b.offset + f.phase * b.speed;
      final wobble = 1 + 0.15 * math.sin(f.phase * 0.9 + b.offset);
      final pos = center + Offset(math.cos(angle), math.sin(angle)) * radius * b.orbit * wobble;
      canvas.drawCircle(
        pos,
        radius * b.size,
        Paint()
          ..color = _tint(b.color).withValues(alpha: disabled ? 0.5 : 0.85)
          ..maskFilter = MaskFilter.blur(BlurStyle.normal, radius * 0.28),
      );
    }
    final highlight = center + Offset(-radius * 0.32, -radius * 0.38);
    canvas.drawCircle(
      highlight,
      radius * 0.36,
      Paint()
        ..color = Colors.white.withValues(alpha: disabled ? 0.18 : 0.38)
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, radius * 0.22),
    );
    canvas.restore();

    canvas.drawCircle(
      center,
      radius - 0.5,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..color = Colors.white.withValues(alpha: 0.25),
    );
  }

  @override
  bool shouldRepaint(_OrbPainter old) => old.disabled != disabled || old.isDark != isDark || old.frame != frame;
}

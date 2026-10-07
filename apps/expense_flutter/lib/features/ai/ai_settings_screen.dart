import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/ai_settings.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../profile/settings_widgets.dart';
import 'ai_strings.dart';

const _onColor = Color(0xFF22C55E);
const _offColor = Color(0xFFEF4444);

const _icons = {
  AiFeature.advisor: Icons.auto_awesome_rounded,
  AiFeature.voice: Icons.graphic_eq_rounded,
  AiFeature.receipt: Icons.document_scanner_outlined,
};

class AiSettingsScreen extends ConsumerWidget {
  const AiSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(aiStrings);
    final features = ref.watch(aiSettingsProvider);
    return SettingsScaffold(
      title: t.section,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            children: [
              for (final feature in AiFeature.values) ...[
                if (feature != AiFeature.values.first) const SizedBox(height: 12),
                _FeatureCard(
                  feature: feature,
                  enabled: features[feature] ?? true,
                  strings: t,
                  onChanged: (next) => ref.read(aiSettingsProvider.notifier).set(feature, next),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({required this.feature, required this.enabled, required this.strings, required this.onChanged});

  final AiFeature feature;
  final bool enabled;
  final AiStrings strings;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final title = strings.titles[feature]!;
    final accent = enabled ? _onColor : _offColor;

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(24)),
      child: Stack(
        children: [
          Positioned.fill(child: _DotField(key: ValueKey(enabled), color: accent)),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 12, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(_icons[feature], size: 20, color: colors.muted),
                    const SizedBox(width: 12),
                    Flexible(
                      child: Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _StatusBadge(label: enabled ? strings.on : strings.off, color: accent),
                    const Spacer(),
                    Semantics(
                      label: title,
                      child: Switch(
                        value: enabled,
                        onChanged: onChanged,
                        thumbColor: const WidgetStatePropertyAll(Colors.white),
                        trackColor: WidgetStateProperty.resolveWith(
                          (states) => states.contains(WidgetState.selected)
                              ? _onColor
                              : _offColor.withValues(alpha: 0.7),
                        ),
                        trackOutlineColor: const WidgetStatePropertyAll(Colors.transparent),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Padding(
                  padding: const EdgeInsets.only(left: 32, right: 72),
                  child: Text(
                    strings.descriptions[feature]!,
                    style: TextStyle(fontSize: 13, height: 1.35, color: colors.muted),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(999)),
        child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
      );
}

// Two drifting dot grids read as spray from the switch.
class _DotField extends StatefulWidget {
  const _DotField({super.key, required this.color});
  final Color color;

  @override
  State<_DotField> createState() => _DotFieldState();
}

class _DotFieldState extends State<_DotField> with TickerProviderStateMixin {
  late final _drift = AnimationController(vsync: this, duration: const Duration(seconds: 80));
  late final _reveal = AnimationController(vsync: this, duration: const Duration(milliseconds: 550));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (reduceMotion) {
      _drift.stop();
      _reveal.value = 1;
    } else {
      if (!_drift.isAnimating) _drift.repeat();
      if (_reveal.value == 0) _reveal.forward();
    }
  }

  @override
  void dispose() {
    _drift.dispose();
    _reveal.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reveal = CurvedAnimation(parent: _reveal, curve: Curves.easeOut);
    return IgnorePointer(
      child: Align(
        alignment: Alignment.centerRight,
        child: FractionallySizedBox(
          widthFactor: 0.75,
          heightFactor: 1,
          child: AnimatedBuilder(
            animation: reveal,
            builder: (context, child) => Opacity(
              opacity: reveal.value,
              child: Transform.scale(
                scaleX: 0.4 + 0.6 * reveal.value,
                alignment: Alignment.centerRight,
                child: child,
              ),
            ),
            child: RepaintBoundary(
              child: CustomPaint(painter: _DotPainter(_drift, widget.color)),
            ),
          ),
        ),
      ),
    );
  }
}

class _DotPainter extends CustomPainter {
  _DotPainter(this.drift, this.color) : super(repaint: drift);

  final Animation<double> drift;
  final Color color;

  static const _cycleSeconds = 80.0;
  static const _layers = [
    (spacing: 12.0, radius: 1.2, opacity: 0.55, period: 3.2),
    (spacing: 19.0, radius: 0.9, opacity: 0.35, period: 5.0),
  ];

  // Mirrors the web's radial mask anchored at the switch side.
  double _fade(Offset p, Size size) {
    final dx = (size.width - p.dx) / (size.width * 1.3);
    final dy = (p.dy - size.height / 2) / (size.height * 1.2);
    final d = math.sqrt(dx * dx + dy * dy);
    if (d <= 0.3) return 1 - (0.45 * d / 0.3);
    if (d <= 0.68) return 0.55 * (1 - (d - 0.3) / 0.38);
    return 0;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final seconds = drift.value * _cycleSeconds;
    final paint = Paint();
    for (final layer in _layers) {
      final progress = (seconds / layer.period) % 1;
      final shift = progress * layer.spacing * 2;
      for (var y = layer.spacing / 2; y < size.height; y += layer.spacing) {
        for (var x = layer.spacing / 2 - shift; x < size.width + layer.spacing; x += layer.spacing) {
          if (x < 0) continue;
          final alpha = _fade(Offset(x, y), size) * layer.opacity;
          if (alpha <= 0.01) continue;
          paint.color = color.withValues(alpha: alpha);
          canvas.drawCircle(Offset(x, y), layer.radius, paint);
        }
      }
    }
  }

  @override
  bool shouldRepaint(_DotPainter old) => old.color != color || old.drift != drift;
}

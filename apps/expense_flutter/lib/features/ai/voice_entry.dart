import 'dart:async';
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import '../../core/ai_settings.dart';
import '../../core/i18n.dart';
import '../../core/money.dart';
import '../../core/theme.dart';
import '../../data/ai_api.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import '../transactions/transaction_form_sheet.dart';
import 'ai_entry_strings.dart';
import 'confirm_entry_sheet.dart';

const _silenceLevel = 0.02;
const _silenceAfterSpeech = Duration(milliseconds: 1600);
const _noSpeechTimeout = Duration(seconds: 6);
const _maxRecording = Duration(seconds: 20);

typedef _Saved = ({List<String> ids, List<EntryDraft> entries, String heard});

enum _Phase { idle, listening, processing, confirm }

/// Records a spoken transaction and saves what the AI heard.
Future<void> startVoiceEntry(BuildContext context, WidgetRef ref) async {
  if (ref.read(aiSettingsProvider)[AiFeature.voice] == false) {
    await showTransactionForm(context);
    return;
  }
  final messenger = ScaffoldMessenger.of(context);
  final t = readAiEntryStrings(ref);
  final saved = await showAiSheet<_Saved>(context, (_) => const _VoiceSheet());
  if (saved == null || saved.ids.isEmpty) return;

  String signed(EntryDraft e) => '${e.type == TxType.income ? '+' : '-'}${money(e.amount)}';
  final entries = saved.entries;
  final single = entries.length == 1 ? entries.first : null;
  final title = single != null ? '${signed(single)} · ${single.title}' : t.savedMany(entries.length);
  final detail = single != null
      ? (single.items.isNotEmpty
            ? t.itemsSaved(single.items.length)
            : saved.heard.isNotEmpty
            ? '“${saved.heard}”'
            : null)
      : entries.map((e) => '${e.title} ${signed(e)}').join(' · ');

  messenger.showSnackBar(
    SnackBar(
      duration: const Duration(seconds: 6),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title),
          if (detail != null)
            Text(
              detail,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12, color: Colors.white70),
            ),
        ],
      ),
      action: SnackBarAction(
        label: t.undo,
        onPressed: () async {
          final repo = ref.read(repositoryProvider);
          try {
            await Future.wait(saved.ids.map(repo.delete));
          } catch (e) {
            messenger.showSnackBar(SnackBar(content: Text('$e')));
          }
          ref.read(dataVersionProvider.notifier).bump();
        },
      ),
    ),
  );
}

class _VoiceSheet extends ConsumerStatefulWidget {
  const _VoiceSheet();

  @override
  ConsumerState<_VoiceSheet> createState() => _VoiceSheetState();
}

class _VoiceSheetState extends ConsumerState<_VoiceSheet> {
  final _recorder = AudioRecorder();
  final _level = ValueNotifier<double>(0);
  StreamSubscription<Amplitude>? _amplitude;
  _Phase _phase = _Phase.idle;
  String? _error;
  List<EntryDraft> _drafts = const [];
  String _heard = '';
  String? _saveError;

  bool _heardSpeech = false;
  DateTime _startedAt = DateTime.now();
  DateTime _quietSince = DateTime.now();

  @override
  void initState() {
    super.initState();
    _start();
  }

  @override
  void dispose() {
    _amplitude?.cancel();
    _recorder.dispose();
    _level.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    final t = readAiEntryStrings(ref);
    setState(() {
      _phase = _Phase.listening;
      _error = null;
      _saveError = null;
    });
    try {
      if (!await _recorder.hasPermission()) {
        if (mounted) {
          setState(() {
            _phase = _Phase.idle;
            _error = t.micDenied;
          });
        }
        return;
      }
      final dir = await getTemporaryDirectory();
      final path = '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.wav';
      await _recorder.start(
        const RecordConfig(encoder: AudioEncoder.wav, sampleRate: 16000, numChannels: 1),
        path: path,
      );
    } catch (_) {
      if (mounted) {
        setState(() {
          _phase = _Phase.idle;
          _error = t.micFailed;
        });
      }
      return;
    }
    if (!mounted) {
      await _recorder.cancel();
      return;
    }
    _heardSpeech = false;
    _startedAt = DateTime.now();
    _quietSince = _startedAt;
    _amplitude = _recorder.onAmplitudeChanged(const Duration(milliseconds: 80)).listen(_onAmplitude);
  }

  /// Converts dBFS to the web's RMS scale so thresholds match.
  void _onAmplitude(Amplitude amplitude) {
    final rms = amplitude.current.isFinite && amplitude.current > -120
        ? math.pow(10, amplitude.current / 20).toDouble()
        : 0.0;
    _level.value = math.min(1, rms * 8);
    final now = DateTime.now();
    if (rms > _silenceLevel) {
      _heardSpeech = true;
      _quietSince = now;
    }
    final elapsed = now.difference(_startedAt);
    if ((_heardSpeech && now.difference(_quietSince) > _silenceAfterSpeech) ||
        (!_heardSpeech && elapsed > _noSpeechTimeout) ||
        elapsed > _maxRecording) {
      _stop();
    }
  }

  Future<void> _stop() async {
    if (_phase != _Phase.listening) return;
    final t = readAiEntryStrings(ref);
    setState(() => _phase = _Phase.processing);
    await _amplitude?.cancel();
    _amplitude = null;
    _level.value = 0;

    List<int> bytes = const [];
    try {
      final path = await _recorder.stop();
      if (path != null) {
        final file = File(path);
        bytes = await file.readAsBytes();
        await file.delete();
      }
    } catch (_) {
      bytes = const [];
    }
    if (bytes.length <= 44) return _fail(t.noAudio);
    await _process(bytes);
  }

  void _fail(String message) {
    if (mounted) {
      setState(() {
        _phase = _Phase.idle;
        _error = message;
      });
    }
  }

  Future<void> _process(List<int> bytes) async {
    final t = readAiEntryStrings(ref);
    Map<String, dynamic> parsed;
    try {
      parsed = await ref.read(aiApiProvider).parseVoice(Uint8List.fromList(bytes), isoDay(DateTime.now()));
    } on AiApiException catch (e) {
      return _fail(e.message);
    } catch (_) {
      return _fail(t.processFailed);
    }
    if (!mounted) return;

    final raw = parsed['entries'];
    final drafts = [
      if (raw is List)
        for (final entry in raw.whereType<Map>()) EntryDraft.fromVoice(Map<String, dynamic>.from(entry)),
    ];
    for (final d in drafts) {
      if (d.title.isEmpty) d.title = t.fallbackVoiceTitle;
    }
    if (drafts.isEmpty) return _fail(t.processFailed);
    _heard = '${parsed['heard'] ?? ''}'.trim();

    if (drafts.any((d) => !d.confident || !d.isValid)) {
      setState(() {
        _phase = _Phase.confirm;
        _drafts = drafts;
      });
      return;
    }
    try {
      await _save(drafts);
    } catch (e) {
      if (mounted) {
        setState(() {
          _phase = _Phase.confirm;
          _drafts = drafts;
          _saveError = '${t.processFailed}: $e';
        });
      }
    }
  }

  /// One unclear entry holds the batch, so nothing half-saves.
  Future<void> _save(List<EntryDraft> entries) async {
    final repo = ref.read(repositoryProvider);
    final ids = <String>[];
    try {
      for (final e in entries) {
        ids.add(
          await repo.add(
            type: e.type,
            title: e.title,
            amount: e.amount,
            occurredAt: e.date,
            category: e.category,
            items: e.items,
          ),
        );
      }
    } catch (_) {
      await Future.wait(ids.map(repo.delete));
      rethrow;
    }
    ref.read(dataVersionProvider.notifier).bump();
    if (mounted) Navigator.of(context).pop<_Saved>((ids: ids, entries: entries, heard: _heard));
  }

  Future<void> _confirm(List<EntryDraft> entries) async {
    final t = readAiEntryStrings(ref);
    try {
      await _save(entries);
    } catch (e) {
      if (mounted) setState(() => _saveError = '${t.processFailed}: $e');
    }
  }

  Future<void> _close() async {
    if (_phase == _Phase.listening) {
      await _amplitude?.cancel();
      await _recorder.cancel();
    }
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(aiEntryStrings);
    final colors = context.colors;
    final confirming = _phase == _Phase.confirm;

    return AiSheetFrame(
      title: confirming ? t.checkAndSave : t.saySpent,
      closeLabel: t.close,
      onClose: _close,
      child: confirming
          ? ConfirmEntryForm(
              key: ObjectKey(_drafts),
              entries: _drafts,
              heard: _heard,
              notice: _saveError,
              onSave: _confirm,
              onRetry: _start,
            )
          : Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 20,
                  child: Text(
                    _phase == _Phase.processing ? t.understanding : (_error ?? ''),
                    style: TextStyle(fontSize: 14, color: _error != null ? colors.expense : colors.muted),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(0, 8, 0, 16),
                  child: _VoiceOrb(level: _level, phase: _phase, error: _error != null),
                ),
                SizedBox(
                  height: 56,
                  child: switch (_phase) {
                    _Phase.processing || _Phase.confirm => null,
                    _Phase.listening => _RoundButton(
                      label: t.stopRecording,
                      color: colors.expense,
                      foreground: Colors.white,
                      icon: Icons.stop_rounded,
                      onTap: _stop,
                    ),
                    _Phase.idle => _RoundButton(
                      label: t.startRecording,
                      color: Theme.of(context).colorScheme.primary,
                      foreground: Theme.of(context).colorScheme.onPrimary,
                      icon: Icons.mic_rounded,
                      onTap: _start,
                    ),
                  },
                ),
              ],
            ),
    );
  }
}

class _RoundButton extends StatelessWidget {
  const _RoundButton({
    required this.label,
    required this.color,
    required this.foreground,
    required this.icon,
    required this.onTap,
  });
  final String label;
  final Color color;
  final Color foreground;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      button: true,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          child: Icon(icon, color: foreground, size: 26),
        ),
      ),
    );
  }
}

/// Gradient orb that swells with mic level and spins while thinking.
class _VoiceOrb extends StatefulWidget {
  const _VoiceOrb({required this.level, required this.phase, required this.error});
  final ValueNotifier<double> level;
  final _Phase phase;
  final bool error;

  @override
  State<_VoiceOrb> createState() => _VoiceOrbState();
}

class _VoiceOrbState extends State<_VoiceOrb> with SingleTickerProviderStateMixin {
  static const _from = Color(0xFF82F4FF);
  static const _to = Color(0xFF8E6CFF);
  static const _size = 168.0;

  late final _ticker = AnimationController(vsync: this, duration: const Duration(seconds: 6))..repeat();
  double _smoothed = 0;

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final from = widget.error ? context.colors.muted : _from;
    final to = widget.error ? context.colors.surface2 : _to;
    return SizedBox.square(
      dimension: _size + 40,
      child: AnimatedBuilder(
        animation: Listenable.merge([_ticker, widget.level]),
        builder: (context, _) {
          final phase = _ticker.value * 2 * math.pi;
          final thinking = widget.phase == _Phase.processing;
          final listening = widget.phase == _Phase.listening;
          _smoothed += (widget.level.value - _smoothed) * 0.25;
          final breathe = 0.5 + 0.5 * math.sin(phase * (thinking ? 4 : 2));
          final scale = listening ? 0.9 + _smoothed * 0.3 + breathe * 0.03 : 0.88 + breathe * (thinking ? 0.06 : 0.03);
          final spin = phase * (thinking ? 3 : 1);
          return Center(
            child: Transform.scale(
              scale: scale,
              child: Container(
                width: _size,
                height: _size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: to.withValues(alpha: 0.35 + _smoothed * 0.35),
                      blurRadius: 40 + _smoothed * 40,
                      spreadRadius: 2 + _smoothed * 12,
                    ),
                  ],
                  gradient: SweepGradient(
                    colors: [from, to, from.withValues(alpha: 0.85), to, from],
                    transform: GradientRotation(spin),
                  ),
                ),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      center: Alignment(-0.35 + 0.1 * math.cos(spin), -0.4 + 0.1 * math.sin(spin)),
                      radius: 0.9,
                      colors: [Colors.white.withValues(alpha: 0.55), Colors.white.withValues(alpha: 0)],
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

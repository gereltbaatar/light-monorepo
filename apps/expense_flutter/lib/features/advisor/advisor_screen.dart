import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/ai_settings.dart';
import '../../core/i18n.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../../data/ai_api.dart';
import '../../data/repository.dart';
import '../ai/ai_settings_screen.dart';
import '../ai/ai_strings.dart';
import 'advisor_orb.dart';
import 'advisor_providers.dart';
import 'advisor_sections.dart';
import 'advisor_strings.dart';
import 'spending_summary.dart';

typedef ChatMessage = ({String role, String text});

const _sendGradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [Color(0xFF4285F4), Color(0xFF9B72CB), Color(0xFFEA4335)],
);

class AdvisorScreen extends ConsumerWidget {
  const AdvisorScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enabled = ref.watch(aiSettingsProvider)[AiFeature.advisor] ?? true;
    return enabled ? const _AdvisorView() : const _DisabledView();
  }
}

class _DisabledView extends ConsumerWidget {
  const _DisabledView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(aiStrings);
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 64, 16, 128),
          children: [
            const Center(child: AdvisorOrb(disabled: true)),
            const SizedBox(height: 32),
            Text(
              t.disabledTitle,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.5),
            ),
            const SizedBox(height: 8),
            Text(
              t.disabledBody,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: context.colors.muted),
            ),
            const SizedBox(height: 24),
            Center(
              child: FilledButton(
                style: FilledButton.styleFrom(
                  minimumSize: const Size(0, 48),
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => const AiSettingsScreen()),
                ),
                child: Text(t.openSettings),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AdvisorView extends ConsumerStatefulWidget {
  const _AdvisorView();

  @override
  ConsumerState<_AdvisorView> createState() => _AdvisorViewState();
}

class _AdvisorViewState extends ConsumerState<_AdvisorView> {
  final _scroll = ScrollController();
  final _input = TextEditingController();
  final _messages = <ChatMessage>[];
  var _thinking = false;

  @override
  void initState() {
    super.initState();
    _input.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _scroll.dispose();
    _input.dispose();
    super.dispose();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _ask(String question) async {
    final text = question.trim();
    if (text.isEmpty || _thinking) return;
    final t = ref.read(localeProvider) == AppLocale.mn ? advisorStrings.mn : advisorStrings.en;
    setState(() {
      _messages.add((role: 'user', text: text));
      _thinking = true;
    });
    _scrollToEnd();

    String reply;
    try {
      final result = await ref.read(aiApiProvider).chat([
        for (final m in _messages) {'role': m.role, 'text': m.text},
      ]);
      reply = '${result['reply'] ?? ''}';
    } on AiApiException catch (e) {
      reply = e.message;
    } catch (_) {
      reply = t.chatFailed;
    }
    if (!mounted) return;
    setState(() {
      _messages.add((role: 'model', text: reply));
      _thinking = false;
    });
    _scrollToEnd();
  }

  void _submit() {
    if (_input.text.trim().isEmpty) return;
    _ask(_input.text);
    _input.clear();
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(advisorStrings);
    final colors = context.colors;
    final transactions = ref.watch(allTransactionsProvider).value ?? const [];
    final summary = buildSpendingSummary(transactions);

    final view = View.of(context);
    final keyboardOpen = view.viewInsets.bottom > 0;
    final safeBottom = view.padding.bottom / view.devicePixelRatio;
    final inputBottom = keyboardOpen ? 12.0 : math.max(safeBottom, 12.0) + 72 + 16;
    const horizontal = EdgeInsets.symmetric(horizontal: 16);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            RefreshIndicator(
              onRefresh: () async {
                ref.read(dataVersionProvider.notifier).bump();
                ref.invalidate(questionsProvider);
              },
              child: ListView(
                controller: _scroll,
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                padding: EdgeInsets.only(bottom: inputBottom + 56 + 40),
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 32, 16, 24),
                    child: Column(
                      children: [
                        AdvisorOrb(thinking: _thinking),
                        const SizedBox(height: 24),
                        Text(t.greeting, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: colors.muted)),
                        const SizedBox(height: 4),
                        Text(
                          t.heading,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w700, letterSpacing: -0.75),
                        ),
                      ],
                    ),
                  ),
                  Padding(padding: horizontal, child: SpendingStats(summary: summary)),
                  const SizedBox(height: 24),
                  const Padding(padding: horizontal, child: AdviceSection()),
                  const SizedBox(height: 24),
                  QuestionsSection(onAsk: _ask, busy: _thinking),
                  if (_messages.isNotEmpty || _thinking) ...[
                    const SizedBox(height: 24),
                    Padding(
                      padding: horizontal,
                      child: _ChatThread(messages: _messages, thinking: _thinking, thinkingLabel: t.thinking),
                    ),
                  ],
                ],
              ),
            ),
            Positioned(
              left: 16,
              right: 16,
              bottom: inputBottom,
              child: _ChatInput(
                controller: _input,
                thinking: _thinking,
                placeholder: t.askPlaceholder,
                sendLabel: t.send,
                onSubmit: _submit,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChatThread extends StatelessWidget {
  const _ChatThread({required this.messages, required this.thinking, required this.thinkingLabel});

  final List<ChatMessage> messages;
  final bool thinking;
  final String thinkingLabel;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final scheme = Theme.of(context).colorScheme;
    const big = Radius.circular(24);
    const small = Radius.circular(8);

    Widget bubble({required bool mine, required Widget child}) => Align(
          alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
          child: FractionallySizedBox(
            widthFactor: 0.85,
            alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
            child: Align(
              alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: mine ? scheme.primary : colors.surface,
                  borderRadius: BorderRadius.only(
                    topLeft: big,
                    topRight: big,
                    bottomLeft: mine ? big : small,
                    bottomRight: mine ? small : big,
                  ),
                ),
                child: child,
              ),
            ),
          ),
        );

    return Column(
      children: [
        for (var i = 0; i < messages.length; i++) ...[
          if (i > 0) const SizedBox(height: 12),
          bubble(
            mine: messages[i].role == 'user',
            child: SelectableText(
              messages[i].text,
              style: TextStyle(
                fontSize: 14,
                height: 1.45,
                color: messages[i].role == 'user' ? scheme.onPrimary : scheme.onSurface,
              ),
            ),
          ),
        ],
        if (thinking) ...[
          if (messages.isNotEmpty) const SizedBox(height: 12),
          bubble(
            mine: false,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox.square(
                  dimension: 14,
                  child: CircularProgressIndicator(strokeWidth: 2, color: colors.muted),
                ),
                const SizedBox(width: 8),
                Text(thinkingLabel, style: TextStyle(fontSize: 14, color: colors.muted)),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _ChatInput extends StatelessWidget {
  const _ChatInput({
    required this.controller,
    required this.thinking,
    required this.placeholder,
    required this.sendLabel,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final bool thinking;
  final String placeholder;
  final String sendLabel;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final foreground = Theme.of(context).colorScheme.onSurface;
    final canSend = !thinking && controller.text.trim().isNotEmpty;
    const shadow = [BoxShadow(color: Color(0x26000000), blurRadius: 15, offset: Offset(0, 10))];

    return Row(
      children: [
        Expanded(
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: colors.border),
              boxShadow: shadow,
            ),
            child: TextField(
              controller: controller,
              maxLength: 1000,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSubmit(),
              style: TextStyle(fontSize: 14, color: foreground),
              decoration: InputDecoration(
                hintText: placeholder,
                counterText: '',
                filled: false,
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Semantics(
          button: true,
          label: sendLabel,
          child: GestureDetector(
            onTap: canSend ? onSubmit : null,
            child: Opacity(
              opacity: canSend ? 1 : 0.5,
              child: Container(
                width: 56,
                height: 56,
                alignment: Alignment.center,
                decoration: const BoxDecoration(shape: BoxShape.circle, gradient: _sendGradient, boxShadow: shadow),
                child: thinking
                    ? const SizedBox.square(
                        dimension: 20,
                        child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white),
                      )
                    : const Icon(Icons.arrow_upward_rounded, color: Colors.white, size: 22),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

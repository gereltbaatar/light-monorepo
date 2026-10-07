import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/ai_settings.dart';
import '../../core/settings.dart';
import '../../data/ai_api.dart';
import '../../data/repository.dart';

typedef AdviceInsight = ({String title, String detail, String tone});
typedef Advice = ({String headline, List<AdviceInsight> insights});
typedef PopularQuestions = ({List<String> questions, bool fromSearch});

final adviceProvider = FutureProvider<Advice>((ref) async {
  ref.watch(dataVersionProvider);
  ref.watch(localeProvider);
  ref.watch(aiSettingsProvider);
  final json = await ref.read(aiApiProvider).advice();
  return (
    headline: '${json['headline'] ?? ''}',
    insights: [
      for (final raw in (json['insights'] as List? ?? const []))
        if (raw is Map)
          (title: '${raw['title'] ?? ''}', detail: '${raw['detail'] ?? ''}', tone: '${raw['tone'] ?? 'info'}'),
    ],
  );
});

final questionsProvider = FutureProvider<PopularQuestions>((ref) async {
  ref.watch(localeProvider);
  ref.watch(aiSettingsProvider);
  final json = await ref.read(aiApiProvider).questions();
  return (
    questions: [for (final q in (json['questions'] as List? ?? const [])) '$q'],
    fromSearch: json['source'] == 'search',
  );
});

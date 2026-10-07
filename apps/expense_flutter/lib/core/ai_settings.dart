import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'settings.dart';

enum AiFeature { advisor, voice, receipt }

typedef AiFeatures = Map<AiFeature, bool>;

/// Same switches as the web's Profile → AI settings, stored on this device.
class AiSettingsNotifier extends Notifier<AiFeatures> {
  static const _key = 'ai-features-off';

  @override
  AiFeatures build() {
    final off = ref.read(sharedPreferencesProvider).getStringList(_key) ?? const [];
    return {for (final f in AiFeature.values) f: !off.contains(f.name)};
  }

  void set(AiFeature feature, bool enabled) {
    state = {...state, feature: enabled};
    ref.read(sharedPreferencesProvider).setStringList(_key, [
      for (final f in AiFeature.values)
        if (state[f] == false) f.name,
    ]);
  }

  /// The web app reads this cookie to gate the AI endpoints.
  String get cookieValue => [
        for (final f in AiFeature.values)
          if (state[f] == false) f.name,
      ].join(',');
}

final aiSettingsProvider = NotifierProvider<AiSettingsNotifier, AiFeatures>(AiSettingsNotifier.new);

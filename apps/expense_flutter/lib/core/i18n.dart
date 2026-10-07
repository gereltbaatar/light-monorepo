import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'settings.dart';

/// A pair of translations, like the web app's defineDictionary({ en, mn }).
typedef Dict<T> = ({T en, T mn});

extension DictRef on WidgetRef {
  /// Rebuilds the widget when the language changes.
  T tr<T>(Dict<T> dict) => watch(localeProvider) == AppLocale.mn ? dict.mn : dict.en;
}

extension DictProviderRef on Ref {
  T tr<T>(Dict<T> dict) => watch(localeProvider) == AppLocale.mn ? dict.mn : dict.en;
}

const localeNames = {AppLocale.mn: 'Монгол', AppLocale.en: 'English'};

/// BCP 47 tags for intl date formatting.
const intlLocale = {AppLocale.mn: 'mn', AppLocale.en: 'en_US'};

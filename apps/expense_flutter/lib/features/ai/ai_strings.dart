import '../../core/ai_settings.dart';
import '../../core/i18n.dart';

class AiStrings {
  const AiStrings({
    required this.section,
    required this.disabledTitle,
    required this.disabledBody,
    required this.openSettings,
    required this.on,
    required this.off,
    required this.titles,
    required this.descriptions,
  });

  final String section;
  final String disabledTitle;
  final String disabledBody;
  final String openSettings;
  final String on;
  final String off;
  final Map<AiFeature, String> titles;
  final Map<AiFeature, String> descriptions;
}

const Dict<AiStrings> aiStrings = (
  en: AiStrings(
    section: 'AI settings',
    disabledTitle: 'This AI feature is turned off',
    disabledBody: 'Turn it back on in Profile → AI settings.',
    openSettings: 'Open settings',
    on: 'On',
    off: 'Off',
    titles: {
      AiFeature.advisor: 'AI Advisor',
      AiFeature.voice: 'Voice entry',
      AiFeature.receipt: 'Receipt scan',
    },
    descriptions: {
      AiFeature.advisor: 'Spending insights and answers to your money questions.',
      AiFeature.voice: 'Say a transaction out loud and it is filled in for you.',
      AiFeature.receipt: 'Photograph a receipt to record it automatically.',
    },
  ),
  mn: AiStrings(
    section: 'AI тохиргоо',
    disabledTitle: 'Энэ AI функц унтраалттай байна',
    disabledBody: 'Профайл → AI тохиргоо хэсгээс дахин асаана уу.',
    openSettings: 'Тохиргоо нээх',
    on: 'Асаалттай',
    off: 'Унтраалттай',
    titles: {
      AiFeature.advisor: 'AI зөвлөх',
      AiFeature.voice: 'Audio бүртгэл',
      AiFeature.receipt: 'Зураг бүртгэл',
    },
    descriptions: {
      AiFeature.advisor: 'Зарлагын дүн шинжилгээ, санхүүгийн асуултад хариулна.',
      AiFeature.voice: 'Гүйлгээгээ дуугаар хэлэхэд автоматаар бөглөгдөнө.',
      AiFeature.receipt: 'Баримтын зургийг авахад автоматаар бүртгэнэ.',
    },
  ),
);

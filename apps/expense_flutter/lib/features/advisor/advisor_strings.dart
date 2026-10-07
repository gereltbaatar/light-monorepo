import '../../core/i18n.dart';

class AdvisorStrings {
  const AdvisorStrings({
    required this.greeting,
    required this.heading,
    required this.analyzing,
    required this.trendingQuestions,
    required this.popularQuestions,
    required this.thinking,
    required this.chatFailed,
    required this.askPlaceholder,
    required this.send,
    required this.thisMonth,
    required this.vsLastMonth,
    required this.topCategory,
    required this.shareOfSpending,
    required this.noExpenses,
    required this.whereMoneyGoes,
    required this.topPlaces,
    required this.visits,
  });

  final String greeting;
  final String heading;
  final String analyzing;
  final String trendingQuestions;
  final String popularQuestions;
  final String thinking;
  final String chatFailed;
  final String askPlaceholder;
  final String send;
  final String thisMonth;
  final String Function(int percent) vsLastMonth;
  final String topCategory;
  final String Function(int percent) shareOfSpending;
  final String noExpenses;
  final String whereMoneyGoes;
  final String topPlaces;
  final String Function(int count) visits;
}

final Dict<AdvisorStrings> advisorStrings = (
  en: AdvisorStrings(
    greeting: "Hi, I'm your money advisor",
    heading: 'How can I help you today?',
    analyzing: 'Analyzing your spending…',
    trendingQuestions: 'Trending finance questions on the web today',
    popularQuestions: 'Popular finance questions',
    thinking: 'Thinking…',
    chatFailed: 'Something went wrong — please try again',
    askPlaceholder: 'Ask about your money…',
    send: 'Send',
    thisMonth: 'This month',
    vsLastMonth: (percent) => '$percent% vs last month',
    topCategory: 'Top category',
    shareOfSpending: (percent) => '$percent% of spending',
    noExpenses: 'No expenses yet',
    whereMoneyGoes: 'Where your money goes · last 30 days',
    topPlaces: 'Top places',
    visits: (count) => '$count ${count == 1 ? 'visit' : 'visits'}',
  ),
  mn: AdvisorStrings(
    greeting: 'Сайн уу, би таны санхүүгийн зөвлөх',
    heading: 'Өнөөдөр юугаар туслах вэ?',
    analyzing: 'Зарлагыг тань шинжилж байна…',
    trendingQuestions: 'Өнөөдөр интернетэд их хайгдаж буй санхүүгийн асуултууд',
    popularQuestions: 'Түгээмэл санхүүгийн асуултууд',
    thinking: 'Бодож байна…',
    chatFailed: 'Алдаа гарлаа — дахин оролдоно уу',
    askPlaceholder: 'Мөнгөнийхөө талаар асуугаарай…',
    send: 'Илгээх',
    thisMonth: 'Энэ сар',
    vsLastMonth: (percent) => 'Өнгөрсөн сараас $percent%',
    topCategory: 'Тэргүүлэх ангилал',
    shareOfSpending: (percent) => 'Зарлагын $percent%',
    noExpenses: 'Зарлага алга',
    whereMoneyGoes: 'Мөнгө хаашаа явж байна · сүүлийн 30 хоног',
    topPlaces: 'Их зарцуулсан газрууд',
    visits: (count) => '$count удаа',
  ),
);

import '../../core/i18n.dart';
import 'stats_data.dart';

class StatsStrings {
  const StatsStrings({
    required this.statistics,
    required this.noData,
    required this.noDataHint,
    required this.week,
    required this.month,
    required this.year,
    required this.income,
    required this.expense,
    required this.spent,
    required this.net,
    required this.byCategory,
    required this.topExpenses,
    required this.dailyAverage,
    required this.transactions,
    required this.noExpensesInPeriod,
    required this.vsPreviousTemplate,
    required this.throughTemplate,
  });

  final String statistics;
  final String noData;
  final String noDataHint;
  final String week;
  final String month;
  final String year;
  final String income;
  final String expense;
  final String spent;
  final String net;
  final String byCategory;
  final String topExpenses;
  final String dailyAverage;
  final String transactions;
  final String noExpensesInPeriod;
  final String vsPreviousTemplate;
  final String throughTemplate;

  String period(StatsPeriod p) => switch (p) {
        StatsPeriod.week => week,
        StatsPeriod.month => month,
        StatsPeriod.year => year,
      };

  String vsPrevious(int percent) => vsPreviousTemplate.replaceAll('{}', '$percent');

  String through(String label) => throughTemplate.replaceAll('{}', label);
}

const Dict<StatsStrings> statsStrings = (
  en: StatsStrings(
    statistics: 'Statistics',
    noData: 'No data yet',
    noDataHint: 'Add a few transactions and your trends will appear here.',
    week: '7 days',
    month: '30 days',
    year: '12 months',
    income: 'Income',
    expense: 'Expense',
    spent: 'Spent',
    net: 'Net',
    byCategory: 'By category',
    topExpenses: 'Biggest expenses',
    dailyAverage: 'Daily average',
    transactions: 'Transactions',
    noExpensesInPeriod: 'No expenses in this period yet.',
    vsPreviousTemplate: '{}% vs previous period',
    throughTemplate: 'Through {}',
  ),
  mn: StatsStrings(
    statistics: 'Статистик',
    noData: 'Мэдээлэл алга',
    noDataHint: 'Хэдэн гүйлгээ нэмэхэд таны хандлага энд гарч ирнэ.',
    week: '7 хоног',
    month: '30 хоног',
    year: '12 сар',
    income: 'Орлого',
    expense: 'Зарлага',
    spent: 'Зарлага',
    net: 'Үлдэгдэл',
    byCategory: 'Ангиллаар',
    topExpenses: 'Томоохон зарлага',
    dailyAverage: 'Өдрийн дундаж',
    transactions: 'Гүйлгээ',
    noExpensesInPeriod: 'Энэ хугацаанд зарлага алга байна.',
    vsPreviousTemplate: 'Өмнөх үеэс {}%',
    throughTemplate: '{} хүртэл',
  ),
);

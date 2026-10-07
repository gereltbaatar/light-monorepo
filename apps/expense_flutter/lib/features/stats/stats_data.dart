import 'dart:ui' show Color;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/categories.dart';
import '../../core/i18n.dart';
import '../../core/settings.dart';
import '../../data/models.dart';
import '../../data/repository.dart';

enum StatsPeriod { week, month, year }

const monthDays = 30;

class SeriesPoint {
  SeriesPoint({required this.label, required this.tick});

  final String label;
  final String tick;
  double income = 0;
  double expense = 0;
}

class CategorySlice {
  const CategorySlice({required this.category, required this.amount, required this.percent});

  final Category category;
  final double amount;
  final int percent;
}

class SpendingStats {
  const SpendingStats({
    required this.period,
    required this.spent,
    required this.earned,
    required this.count,
    required this.spentChangePercent,
    required this.earnedChangePercent,
    required this.series,
    required this.byCategory,
    required this.topExpenses,
  });

  final StatsPeriod period;
  final double spent;
  final double earned;
  final int count;

  /// Null when the previous window had nothing to compare against.
  final int? spentChangePercent;
  final int? earnedChangePercent;
  final List<SeriesPoint> series;
  final List<CategorySlice> byCategory;
  final List<Transaction> topExpenses;
}

DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);

int _daysBetween(DateTime from, DateTime to) =>
    DateTime.utc(to.year, to.month, to.day).difference(DateTime.utc(from.year, from.month, from.day)).inDays;

// Rolling windows ending today, e.g. October through this September.
({DateTime prev, DateTime start, DateTime end}) periodRange(StatsPeriod period, DateTime now) {
  final today = _day(now);
  if (period == StatsPeriod.year) {
    return (
      prev: DateTime(now.year, now.month - 23, 1),
      start: DateTime(now.year, now.month - 11, 1),
      end: DateTime(now.year, now.month + 1, 1),
    );
  }
  final days = period == StatsPeriod.week ? 7 : monthDays;
  return (
    prev: DateTime(today.year, today.month, today.day - (days - 1) - days),
    start: DateTime(today.year, today.month, today.day - (days - 1)),
    end: DateTime(today.year, today.month, today.day + 1),
  );
}

/// Days covered by each rolling window, for the daily average.
int daysElapsed(StatsPeriod period, DateTime now) => switch (period) {
      StatsPeriod.week => 7,
      StatsPeriod.month => monthDays,
      StatsPeriod.year => _daysBetween(DateTime(now.year, now.month - 11, 1), now) + 1,
    };

int? _changePercent(double current, double previous) =>
    previous > 0 ? ((current - previous) / previous * 100).round() : null;

SpendingStats aggregateStats(StatsPeriod period, List<Transaction> rows, DateTime now, String intlLocale) {
  final range = periodRange(period, now);
  final start = range.start;
  final mn = intlLocale.startsWith('mn');

  final series = <SeriesPoint>[];
  late final int Function(DateTime) pointOf;
  if (period == StatsPeriod.year) {
    for (var m = 0; m < 12; m++) {
      final month = DateTime(start.year, start.month + m, 1);
      series.add(SeriesPoint(
        label: DateFormat.yMMMM(intlLocale).format(month),
        tick: mn ? '${month.month}' : DateFormat.MMM(intlLocale).format(month),
      ));
    }
    pointOf = (d) => (d.year - start.year) * 12 + d.month - start.month;
  } else {
    final days = period == StatsPeriod.week ? 7 : monthDays;
    for (var i = 0; i < days; i++) {
      final day = DateTime(start.year, start.month, start.day + i);
      series.add(SeriesPoint(
        label: DateFormat.MMMMd(intlLocale).format(day),
        tick: period == StatsPeriod.week ? DateFormat.E(intlLocale).format(day) : '${day.day}',
      ));
    }
    pointOf = (d) => _daysBetween(start, d);
  }

  final byCategory = <Category, double>{};
  final expenses = <Transaction>[];
  var spent = 0.0;
  var earned = 0.0;
  var count = 0;
  var prevSpent = 0.0;
  var prevEarned = 0.0;

  for (final row in rows) {
    final amount = row.amount;
    if (!amount.isFinite) continue;
    final date = _day(row.occurredAt);
    if (!date.isBefore(range.end) || date.isBefore(range.prev)) continue;
    final isExpense = !row.isIncome;

    if (date.isBefore(start)) {
      if (isExpense) {
        prevSpent += amount;
      } else {
        prevEarned += amount;
      }
      continue;
    }

    count += 1;
    final index = pointOf(date);
    final point = index >= 0 && index < series.length ? series[index] : null;
    if (!isExpense) {
      earned += amount;
      point?.income += amount;
      continue;
    }

    spent += amount;
    point?.expense += amount;
    byCategory[row.category] = (byCategory[row.category] ?? 0) + amount;
    expenses.add(row);
  }

  final slices = byCategory.entries
      .map((e) => CategorySlice(
            category: e.key,
            amount: e.value,
            percent: spent > 0 ? (e.value / spent * 100).round() : 0,
          ))
      .toList()
    ..sort((a, b) => b.amount.compareTo(a.amount));
  expenses.sort((a, b) => b.amount.compareTo(a.amount));

  return SpendingStats(
    period: period,
    spent: spent,
    earned: earned,
    count: count,
    spentChangePercent: _changePercent(spent, prevSpent),
    earnedChangePercent: _changePercent(earned, prevEarned),
    series: series,
    byCategory: slices,
    topExpenses: expenses.take(5).toList(),
  );
}

// Kept apart so a language switch skips the refetch.
final periodRowsProvider = FutureProvider.family<List<Transaction>, StatsPeriod>((ref, period) {
  ref.watch(dataVersionProvider);
  final range = periodRange(period, DateTime.now());
  return ref.watch(repositoryProvider).transactionsBetween(range.prev, range.end);
});

final statsProvider = FutureProvider.family<SpendingStats, StatsPeriod>((ref, period) async {
  final rows = await ref.watch(periodRowsProvider(period).future);
  final locale = intlLocale[ref.watch(localeProvider)] ?? 'mn';
  return aggregateStats(period, rows, DateTime.now(), locale);
});

// Mirrors the web's category color tokens per theme.
Map<Category, Color> categoryColors({required bool dark}) => dark
    ? const {
        Category.food: Color(0xFF3987E5),
        Category.coffee: Color(0xFFD95926),
        Category.shopping: Color(0xFF199E70),
        Category.taxi: Color(0xFFC98500),
        Category.entertainment: Color(0xFFD55181),
        Category.bills: Color(0xFF008300),
        Category.health: Color(0xFF9085E9),
        Category.other: Color(0xFF636366),
      }
    : const {
        Category.food: Color(0xFF2A78D6),
        Category.coffee: Color(0xFFEB6834),
        Category.shopping: Color(0xFF1BAF7A),
        Category.taxi: Color(0xFFEDA100),
        Category.entertainment: Color(0xFFE87BA4),
        Category.bills: Color(0xFF008300),
        Category.health: Color(0xFF4A3AA7),
        Category.other: Color(0xFFA1A1A6),
      };

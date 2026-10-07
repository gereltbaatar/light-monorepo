import '../../core/categories.dart';
import '../../data/models.dart';

typedef CategorySpend = ({Category category, double amount, int share, int count});
typedef MerchantSpend = ({String title, double amount, int count});

class SpendingSummary {
  const SpendingSummary({
    required this.monthSpent,
    required this.lastMonthSpent,
    required this.changePercent,
    required this.byCategory,
    required this.topMerchants,
  });

  final double monthSpent;
  final double lastMonthSpent;

  /// Null when last month had no spending to compare against.
  final int? changePercent;

  /// Last 30 days, largest first.
  final List<CategorySpend> byCategory;
  final List<MerchantSpend> topMerchants;
}

// Matches JS Math.round, which rounds halves toward +infinity.
int _jsRound(double x) => (x + 0.5).floor();

int _monthKey(DateTime d) => d.year * 12 + d.month;

SpendingSummary buildSpendingSummary(List<Transaction> transactions) {
  final now = DateTime.now();
  final thisMonth = _monthKey(now);
  final lastMonth = thisMonth - 1;
  final windowStart = DateTime(now.year, now.month, now.day - 29);

  var monthSpent = 0.0;
  var lastMonthSpent = 0.0;
  var windowSpent = 0.0;
  final categories = <Category, ({double amount, int count})>{};
  final merchants = <String, MerchantSpend>{};

  for (final tx in transactions) {
    if (tx.isIncome) continue;
    final date = DateTime(tx.occurredAt.year, tx.occurredAt.month, tx.occurredAt.day);
    final key = _monthKey(date);
    if (key == thisMonth) monthSpent += tx.amount;
    if (key == lastMonth) lastMonthSpent += tx.amount;
    if (date.isBefore(windowStart)) continue;

    windowSpent += tx.amount;
    final cat = categories[tx.category] ?? (amount: 0.0, count: 0);
    categories[tx.category] = (amount: cat.amount + tx.amount, count: cat.count + 1);

    final name = tx.title.trim();
    final merchant = merchants[name.toLowerCase()] ?? (title: name, amount: 0.0, count: 0);
    merchants[name.toLowerCase()] =
        (title: merchant.title, amount: merchant.amount + tx.amount, count: merchant.count + 1);
  }

  final byCategory = [
    for (final MapEntry(key: category, value: v) in categories.entries)
      (
        category: category,
        amount: v.amount,
        count: v.count,
        share: windowSpent > 0 ? _jsRound(v.amount / windowSpent * 100) : 0,
      ),
  ]..sort((a, b) => b.amount.compareTo(a.amount));

  final topMerchants = (merchants.values.toList()..sort((a, b) => b.amount.compareTo(a.amount))).take(5).toList();

  return SpendingSummary(
    monthSpent: monthSpent,
    lastMonthSpent: lastMonthSpent,
    changePercent: lastMonthSpent > 0 ? _jsRound((monthSpent - lastMonthSpent) / lastMonthSpent * 100) : null,
    byCategory: byCategory,
    topMerchants: topMerchants,
  );
}

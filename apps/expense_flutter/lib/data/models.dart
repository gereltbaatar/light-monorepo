import '../core/categories.dart';

enum TxType { expense, income }

TxType txTypeFrom(Object? raw) => raw == 'income' ? TxType.income : TxType.expense;

class ReceiptItem {
  const ReceiptItem({
    required this.name,
    required this.quantity,
    required this.unitPrice,
    required this.total,
  });

  final String name;
  final num quantity;
  final num unitPrice;
  final num total;

  Map<String, Object> toJson() => {'name': name, 'quantity': quantity, 'unitPrice': unitPrice, 'total': total};

  static List<ReceiptItem> listFrom(Object? raw) {
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map((m) => ReceiptItem(
              name: (m['name'] ?? '').toString(),
              quantity: num.tryParse('${m['quantity']}') ?? 1,
              unitPrice: num.tryParse('${m['unitPrice']}') ?? 0,
              total: num.tryParse('${m['total']}') ?? 0,
            ))
        .where((i) => i.name.isNotEmpty && i.total > 0)
        .toList();
  }
}

class Transaction {
  const Transaction({
    required this.id,
    required this.type,
    required this.title,
    required this.amount,
    required this.occurredAt,
    required this.createdAt,
    required this.category,
    this.receiptUrl,
    this.items = const [],
  });

  final String id;
  final TxType type;
  final String title;

  /// Always positive; the direction lives in [type].
  final double amount;

  /// The day the money moved (a date, not a timestamp).
  final DateTime occurredAt;
  final DateTime createdAt;
  final Category category;
  final String? receiptUrl;
  final List<ReceiptItem> items;

  bool get isIncome => type == TxType.income;

  factory Transaction.fromRow(Map<String, dynamic> row) => Transaction(
        id: row['id'] as String,
        type: txTypeFrom(row['type']),
        title: (row['title'] ?? '') as String,
        // numeric(14,2) can arrive as a string or a number.
        amount: double.tryParse('${row['amount']}') ?? 0,
        occurredAt: DateTime.parse(row['occurred_at'] as String),
        createdAt: DateTime.parse(row['created_at'] as String).toLocal(),
        category: categoryFrom(row['category']),
        receiptUrl: row['receipt_url'] as String?,
        items: ReceiptItem.listFrom(row['items']),
      );
}

class Profile {
  const Profile({required this.id, required this.email, this.displayName, this.avatarUrl});

  final String id;
  final String email;
  final String? displayName;
  final String? avatarUrl;

  /// display_name, else the email's local part, else "User" — same as the web.
  String get name {
    if (displayName != null && displayName!.trim().isNotEmpty) return displayName!;
    final local = email.split('@').first;
    return local.isEmpty ? 'User' : local;
  }

  factory Profile.fromRow(Map<String, dynamic> row) => Profile(
        id: row['id'] as String,
        email: (row['email'] ?? '') as String,
        displayName: row['display_name'] as String?,
        avatarUrl: row['avatar_url'] as String?,
      );
}

/// yyyy-mm-dd for a local calendar day, as the `date` column expects.
String isoDay(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

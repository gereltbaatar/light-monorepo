import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide User;

import '../core/categories.dart';
import 'models.dart';

final supabaseProvider = Provider<SupabaseClient>((ref) => Supabase.instance.client);

const _columns = 'id, type, title, amount, occurred_at, receipt_url, created_at, category, items';

/// Every query relies on RLS for scoping, exactly like the web app.
class Repository {
  Repository(this._db);
  final SupabaseClient _db;

  Future<List<Transaction>> transactions({int limit = 50}) async {
    final rows = await _db
        .from('transactions')
        .select(_columns)
        .order('occurred_at', ascending: false)
        .order('created_at', ascending: false)
        .limit(limit);
    return rows.map(Transaction.fromRow).toList();
  }

  /// Rows with occurred_at in [from, to), oldest first — the input for stats.
  Future<List<Transaction>> transactionsBetween(DateTime from, DateTime to) async {
    final rows = await _db
        .from('transactions')
        .select(_columns)
        .gte('occurred_at', isoDay(from))
        .lt('occurred_at', isoDay(to))
        .order('occurred_at');
    return rows.map(Transaction.fromRow).toList();
  }

  Future<Transaction?> transaction(String id) async {
    final row = await _db.from('transactions').select(_columns).eq('id', id).maybeSingle();
    return row == null ? null : Transaction.fromRow(row);
  }

  Future<({double income, double expense})> balance() async {
    final rows = await _db.from('transactions').select('type, amount');
    var income = 0.0;
    var expense = 0.0;
    for (final row in rows) {
      final amount = double.tryParse('${row['amount']}') ?? 0;
      if (row['type'] == 'income') {
        income += amount;
      } else {
        expense += amount;
      }
    }
    return (income: income, expense: expense);
  }

  Future<String> add({
    required TxType type,
    required String title,
    required double amount,
    required DateTime occurredAt,
    required Category category,
    List<ReceiptItem> items = const [],
    String? receiptUrl,
  }) async {
    final row = await _db
        .from('transactions')
        .insert({
          'user_id': _db.auth.currentUser!.id,
          'type': type.name,
          'title': title.trim(),
          'amount': amount,
          'occurred_at': isoDay(occurredAt),
          'category': category.name,
          'receipt_url': ?receiptUrl,
          if (items.isNotEmpty) 'items': items.map((i) => i.toJson()).toList(),
        })
        .select('id')
        .single();
    return row['id'] as String;
  }

  Future<void> update(
    String id, {
    required TxType type,
    required String title,
    required double amount,
    required DateTime occurredAt,
    required Category category,
  }) async {
    await _db.from('transactions').update({
      'type': type.name,
      'title': title.trim(),
      'amount': amount,
      'occurred_at': isoDay(occurredAt),
      'category': category.name,
    }).eq('id', id);
  }

  Future<void> delete(String id) => _db.from('transactions').delete().eq('id', id);

  Future<Profile?> profile() async {
    final user = _db.auth.currentUser;
    if (user == null) return null;
    final row = await _db.from('profiles').select().eq('id', user.id).maybeSingle();
    return row == null ? null : Profile.fromRow(row);
  }

  Future<void> updateDisplayName(String name) async {
    await _db.from('profiles').update({'display_name': name.trim()}).eq('id', _db.auth.currentUser!.id);
  }
}

final repositoryProvider = Provider<Repository>((ref) => Repository(ref.watch(supabaseProvider)));

/// Bumped after any write so every list, balance and stat reloads.
class DataVersion extends Notifier<int> {
  @override
  int build() => 0;
  void bump() => state++;
}

final dataVersionProvider = NotifierProvider<DataVersion, int>(DataVersion.new);

final recentTransactionsProvider = FutureProvider<List<Transaction>>((ref) {
  ref.watch(dataVersionProvider);
  return ref.watch(repositoryProvider).transactions(limit: 20);
});

final allTransactionsProvider = FutureProvider<List<Transaction>>((ref) {
  ref.watch(dataVersionProvider);
  return ref.watch(repositoryProvider).transactions(limit: 500);
});

final transactionProvider = FutureProvider.family<Transaction?, String>((ref, id) {
  ref.watch(dataVersionProvider);
  return ref.watch(repositoryProvider).transaction(id);
});

final balanceProvider = FutureProvider<({double income, double expense})>((ref) {
  ref.watch(dataVersionProvider);
  return ref.watch(repositoryProvider).balance();
});

final profileProvider = FutureProvider<Profile?>((ref) {
  ref.watch(dataVersionProvider);
  return ref.watch(repositoryProvider).profile();
});

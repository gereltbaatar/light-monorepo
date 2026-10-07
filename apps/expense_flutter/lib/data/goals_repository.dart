import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/i18n.dart';
import '../features/goals/goals_strings.dart';
import 'models.dart';
import 'repository.dart';

enum GoalKind { savings, plan }

enum GoalCategory { general, travel, gadget, home, emergency }

enum GoalPeriod { weekly, monthly, yearly }

enum GoalStatus { active, completed, archived }

enum ContributionDirection { deposit, withdrawal }

T _byName<T extends Enum>(List<T> values, Object? name, T fallback) =>
    values.firstWhere((v) => v.name == name, orElse: () => fallback);

// PostgREST returns numeric columns as strings.
double _num(Object? value) => double.tryParse('$value') ?? 0;

DateTime? _date(Object? value) => value == null ? null : DateTime.tryParse('$value');

class Goal {
  const Goal({
    required this.id,
    required this.kind,
    required this.title,
    required this.imageUrl,
    required this.targetAmount,
    required this.savedAmount,
    required this.category,
    required this.targetDate,
    required this.contributionAmount,
    required this.contributionPeriod,
    required this.startDate,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final GoalKind kind;
  final String title;
  final String? imageUrl;
  final double targetAmount;
  final double savedAmount;
  final GoalCategory category;
  final DateTime? targetDate;
  final double? contributionAmount;
  final GoalPeriod? contributionPeriod;
  final DateTime? startDate;
  final GoalStatus status;
  final DateTime createdAt;

  int get percent =>
      targetAmount <= 0 ? 0 : (savedAmount / targetAmount * 100).round().clamp(0, 100);

  double get remaining => (targetAmount - savedAmount).clamp(0, double.infinity);

  factory Goal.fromRow(Map<String, dynamic> row) => Goal(
        id: row['id'] as String,
        kind: _byName(GoalKind.values, row['kind'], GoalKind.savings),
        title: (row['title'] ?? '') as String,
        imageUrl: row['image_url'] as String?,
        targetAmount: _num(row['target_amount']),
        savedAmount: _num(row['saved_amount']),
        category: _byName(GoalCategory.values, row['category'], GoalCategory.general),
        targetDate: _date(row['target_date']),
        contributionAmount: row['contribution_amount'] == null ? null : _num(row['contribution_amount']),
        contributionPeriod: row['contribution_period'] == null
            ? null
            : _byName(GoalPeriod.values, row['contribution_period'], GoalPeriod.monthly),
        startDate: _date(row['start_date']),
        status: _byName(GoalStatus.values, row['status'], GoalStatus.active),
        createdAt: _date(row['created_at']) ?? DateTime.now(),
      );
}

class GoalContribution {
  const GoalContribution({
    required this.id,
    required this.amount,
    required this.direction,
    required this.contributedOn,
    required this.note,
  });

  final String id;
  final double amount;
  final ContributionDirection direction;
  final DateTime contributedOn;
  final String? note;

  bool get isDeposit => direction == ContributionDirection.deposit;

  factory GoalContribution.fromRow(Map<String, dynamic> row) => GoalContribution(
        id: row['id'] as String,
        amount: _num(row['amount']),
        direction: _byName(ContributionDirection.values, row['direction'], ContributionDirection.deposit),
        contributedOn: _date(row['contributed_on']) ?? DateTime.now(),
        note: row['note'] as String?,
      );
}

/// A validation or database error with a user-facing message.
class GoalFailure implements Exception {
  const GoalFailure(this.message);
  final String message;

  @override
  String toString() => message;
}

const _goalColumns =
    'id, kind, title, image_url, target_amount, saved_amount, category, target_date, contribution_amount, contribution_period, start_date, status, created_at';

bool _tableMissing(String message) =>
    message.contains('Could not find the table') || message.contains('does not exist');

class GoalsRepository {
  GoalsRepository(this._db, this._errors);
  final SupabaseClient _db;
  final GoalErrorStrings _errors;

  Future<List<Goal>> goals() async {
    final rows = await _db
        .from('goal_progress')
        .select(_goalColumns)
        .neq('status', 'archived')
        .order('created_at', ascending: false);
    return rows.map(Goal.fromRow).toList();
  }

  Future<Goal?> goal(String id) async {
    final row = await _db.from('goal_progress').select(_goalColumns).eq('id', id).maybeSingle();
    return row == null ? null : Goal.fromRow(row);
  }

  Future<List<GoalContribution>> contributions(String goalId) async {
    final rows = await _db
        .from('goal_contributions')
        .select('id, amount, direction, contributed_on, note')
        .eq('goal_id', goalId)
        .order('contributed_on', ascending: false)
        .order('created_at', ascending: false);
    return rows.map(GoalContribution.fromRow).toList();
  }

  /// Returns the new goal's id.
  Future<String> createGoal({
    required GoalKind kind,
    required String title,
    required double targetAmount,
    String? imageUrl,
    GoalCategory category = GoalCategory.general,
    DateTime? targetDate,
    double? initialAmount,
    double? contributionAmount,
    GoalPeriod? contributionPeriod,
    DateTime? startDate,
    bool autoContribute = false,
    bool remindOnDue = false,
    bool remindOnMilestone = false,
  }) async {
    final trimmed = title.trim();
    if (trimmed.isEmpty) throw GoalFailure(_errors.titleRequired);
    if (!_isPositive(targetAmount)) throw GoalFailure(_errors.targetPositive);
    if (imageUrl != null && !imageUrl.startsWith('https://res.cloudinary.com/')) {
      throw GoalFailure(_errors.invalidImage);
    }
    final isPlan = kind == GoalKind.plan;
    if (isPlan) {
      if (!_isPositive(contributionAmount)) throw GoalFailure(_errors.contributionPositive);
      if (contributionPeriod == null) throw GoalFailure(_errors.pickPeriod);
      if (startDate == null) throw GoalFailure(_errors.pickStartDate);
    }

    final user = _db.auth.currentUser;
    if (user == null) throw GoalFailure(_errors.signedOut);

    final Map<String, dynamic> row;
    try {
      row = await _db
          .from('goals')
          .insert({
            'user_id': user.id,
            'kind': kind.name,
            'title': trimmed,
            'image_url': imageUrl,
            'target_amount': targetAmount,
            'category': category.name,
            'target_date': targetDate == null ? null : isoDay(targetDate),
            'contribution_amount': isPlan ? contributionAmount : null,
            'contribution_period': isPlan ? contributionPeriod!.name : null,
            'start_date': isPlan ? isoDay(startDate!) : null,
            'auto_contribute': isPlan && autoContribute,
            'remind_on_due': remindOnDue,
            'remind_on_milestone': remindOnMilestone,
          })
          .select('id')
          .single();
    } on PostgrestException catch (e) {
      throw GoalFailure(_tableMissing(e.message) ? _errors.tableMissing : e.message);
    }
    final id = row['id'] as String;

    if (_isPositive(initialAmount)) {
      try {
        await _db.from('goal_contributions').insert({
          'goal_id': id,
          'user_id': user.id,
          'amount': initialAmount,
          'direction': ContributionDirection.deposit.name,
          'note': _errors.startingAmount,
        });
      } on PostgrestException catch (e) {
        throw GoalFailure(e.message);
      }
    }
    return id;
  }

  Future<void> addContribution(
    String goalId, {
    required double amount,
    required ContributionDirection direction,
    String? note,
  }) async {
    if (!_isPositive(amount)) throw GoalFailure(_errors.amountPositive);
    final user = _db.auth.currentUser;
    if (user == null) throw GoalFailure(_errors.signedOut);

    if (direction == ContributionDirection.withdrawal) {
      final current =
          await _db.from('goal_progress').select('saved_amount').eq('id', goalId).maybeSingle();
      if (current == null) throw GoalFailure(_errors.notFound);
      if (amount > _num(current['saved_amount'])) throw GoalFailure(_errors.overWithdraw);
    }

    final trimmedNote = note?.trim() ?? '';
    try {
      await _db.from('goal_contributions').insert({
        'goal_id': goalId,
        'user_id': user.id,
        'amount': amount,
        'direction': direction.name,
        'note': trimmedNote.isEmpty ? null : trimmedNote,
      });
    } on PostgrestException catch (e) {
      throw GoalFailure(e.message);
    }

    final goal = await _db
        .from('goal_progress')
        .select('saved_amount, target_amount, status')
        .eq('id', goalId)
        .maybeSingle();
    if (goal == null || goal['status'] == GoalStatus.archived.name) return;
    final reached = _num(goal['saved_amount']) >= _num(goal['target_amount']);
    final status = reached ? GoalStatus.completed : GoalStatus.active;
    if (status.name != goal['status']) {
      await _db.from('goals').update({
        'status': status.name,
        'completed_at': reached ? DateTime.now().toUtc().toIso8601String() : null,
      }).eq('id', goalId);
    }
  }

  Future<void> deleteGoal(String goalId) async {
    final List<Map<String, dynamic>> rows;
    try {
      rows = await _db.from('goals').delete().eq('id', goalId).select('id');
    } on PostgrestException catch (e) {
      throw GoalFailure(e.message);
    }
    if (rows.isEmpty) throw GoalFailure(_errors.notFound);
  }
}

bool _isPositive(double? n) => n != null && n.isFinite && n > 0;

final goalsRepositoryProvider = Provider<GoalsRepository>(
  (ref) => GoalsRepository(ref.watch(supabaseProvider), ref.tr(goalsStrings).errors),
);

final goalsProvider = FutureProvider<List<Goal>>((ref) {
  ref.watch(dataVersionProvider);
  return ref.watch(goalsRepositoryProvider).goals();
});

final goalProvider = FutureProvider.family<Goal?, String>((ref, id) {
  ref.watch(dataVersionProvider);
  return ref.watch(goalsRepositoryProvider).goal(id);
});

final goalContributionsProvider = FutureProvider.family<List<GoalContribution>, String>((ref, id) {
  ref.watch(dataVersionProvider);
  return ref.watch(goalsRepositoryProvider).contributions(id);
});

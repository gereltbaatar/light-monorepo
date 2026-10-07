import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../features/advisor/advisor_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/goals/goal_detail_screen.dart';
import '../features/goals/new_goal_screen.dart';
import '../features/home/home_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/shell/app_shell.dart';
import '../features/stats/stats_screen.dart';
import '../features/transactions/all_transactions_screen.dart';
import '../features/transactions/transaction_detail_screen.dart';

const _publicPaths = {'/login', '/register'};

/// Re-runs the redirect whenever Supabase signs a user in or out.
class _AuthRefresh extends ChangeNotifier {
  _AuthRefresh(Stream<AuthState> stream) {
    _sub = stream.listen((_) => notifyListeners());
  }
  late final StreamSubscription<AuthState> _sub;

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final auth = Supabase.instance.client.auth;
  final refresh = _AuthRefresh(auth.onAuthStateChange);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final signedIn = auth.currentSession != null;
      final isPublic = _publicPaths.contains(state.matchedLocation);
      if (!signedIn && !isPublic) return '/login';
      if (signedIn && isPublic) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => AppShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/',
              builder: (_, _) => const HomeScreen(),
              routes: [
                GoRoute(path: 'transactions', builder: (_, _) => const AllTransactionsScreen()),
                GoRoute(
                  path: 'transactions/:id',
                  builder: (_, state) => TransactionDetailScreen(id: state.pathParameters['id']!),
                ),
                GoRoute(path: 'goals/new', builder: (_, _) => const NewGoalScreen()),
                GoRoute(
                  path: 'goals/:id',
                  builder: (_, state) => GoalDetailScreen(id: state.pathParameters['id']!),
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/stats', builder: (_, _) => const StatsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/advisor', builder: (_, _) => const AdvisorScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
          ]),
        ],
      ),
    ],
  );
});

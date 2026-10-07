import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../core/theme.dart';
import 'auth_strings.dart';
import 'auth_widgets.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  bool _oauthPending = false;
  String? _oauthError;

  Future<void> _google(AuthStrings t) async {
    setState(() {
      _oauthPending = true;
      _oauthError = null;
    });
    final error = await startGoogleSignIn(t);
    if (mounted) {
      setState(() {
        _oauthPending = false;
        _oauthError = error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(authStrings);
    final colors = context.colors;

    return AuthLayout(
      title: t.signUp,
      subtitle: t.createToStart,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const EmailAuthForm(isRegister: true),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: GoogleButton(
              label: _oauthPending ? t.redirecting : t.continueWithGoogle,
              onPressed: _oauthPending ? null : () => _google(t),
            ),
          ),
          if (_oauthError != null) ...[
            const SizedBox(height: 12),
            AuthNotice(message: _oauthError!, color: colors.expense),
          ],
        ],
      ),
      footer: AuthFooterLink(
        prompt: t.haveAccount,
        action: t.signIn,
        onTap: () => context.go('/login'),
      ),
    );
  }
}

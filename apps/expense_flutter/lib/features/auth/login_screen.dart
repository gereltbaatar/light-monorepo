import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../core/theme.dart';
import 'auth_strings.dart';
import 'auth_widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _emailMode = false;
  bool _oauthPending = false;
  String? _oauthError;
  bool _deepLinkFailed = false;
  late final StreamSubscription<void> _oauthErrors;

  @override
  void initState() {
    super.initState();
    _oauthErrors = listenForOAuthErrors(() {
      if (mounted) setState(() => _deepLinkFailed = true);
    });
  }

  @override
  void dispose() {
    _oauthErrors.cancel();
    super.dispose();
  }

  Future<void> _google(AuthStrings t) async {
    setState(() {
      _oauthPending = true;
      _oauthError = null;
      _deepLinkFailed = false;
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
    final error = _oauthError ?? (_deepLinkFailed ? t.signInFailed : null);

    return PopScope(
      canPop: !_emailMode,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) setState(() => _emailMode = false);
      },
      child: AuthLayout(
        title: _emailMode ? t.signIn : t.welcome,
        subtitle: _emailMode ? t.enterCredentials : t.chooseMethod,
        body: _emailMode
            ? const EmailAuthForm(isRegister: false)
            : Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    FilledButton(
                      onPressed: () => setState(() => _emailMode = true),
                      child: Text(t.continueWithEmail),
                    ),
                    const SizedBox(height: 12),
                    GoogleButton(
                      label: _oauthPending ? t.redirecting : t.continueWithGoogle,
                      onPressed: _oauthPending ? null : () => _google(t),
                    ),
                    if (error != null) ...[
                      const SizedBox(height: 12),
                      AuthNotice(message: error, color: colors.expense),
                    ],
                  ],
                ),
              ),
        footer: AuthFooterLink(
          prompt: t.noAccount,
          action: t.signUp,
          onTap: () => context.go('/register'),
        ),
      ),
    );
  }
}

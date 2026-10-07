import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/env.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import 'auth_strings.dart';

final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

/// Orb up top, title and actions pinned to the bottom, like the web.
class AuthLayout extends StatelessWidget {
  const AuthLayout({
    super.key,
    required this.title,
    required this.subtitle,
    required this.body,
    required this.footer,
  });

  final String title;
  final String subtitle;
  final Widget body;
  final Widget footer;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Scaffold(
      body: Stack(
        children: [
          const Positioned(top: 80, left: 0, right: 0, height: 384, child: GlowOrb()),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) => SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      const SizedBox(height: 160),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 430),
                        child: Column(
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 24),
                              child: Column(
                                children: [
                                  Text(
                                    title,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w700, height: 1.1),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    subtitle,
                                    textAlign: TextAlign.center,
                                    style: TextStyle(fontSize: 14, color: colors.muted),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 48),
                            body,
                            const SizedBox(height: 32),
                            footer,
                            const SizedBox(height: 48),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Stand-in for the web's WebGL eye: slowly breathing blurred circles.
class GlowOrb extends StatefulWidget {
  const GlowOrb({super.key});

  @override
  State<GlowOrb> createState() => _GlowOrbState();
}

class _GlowOrbState extends State<GlowOrb> with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(vsync: this, duration: const Duration(seconds: 6))..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Widget _blob(Color color, double size, Offset offset) => Transform.translate(
        offset: offset,
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final alpha = dark ? 0.75 : 0.55;
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final t = Curves.easeInOut.transform(_controller.value);
          final drift = 14 * math.sin(t * math.pi);
          return ImageFiltered(
            imageFilter: ImageFilter.blur(sigmaX: 48, sigmaY: 48, tileMode: TileMode.decal),
            child: Stack(
              alignment: Alignment.center,
              children: [
                _blob(const Color(0xFFFF6F37).withValues(alpha: alpha), 200 + 20 * t, Offset(-drift, 0)),
                _blob(const Color(0xFFFF3B6B).withValues(alpha: alpha * 0.8), 150, Offset(50 + drift, -30)),
                _blob(const Color(0xFFFFB347).withValues(alpha: alpha * 0.9), 120 - 10 * t, Offset(-30, 50 - drift)),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Email + password form shared by sign-in and sign-up.
class EmailAuthForm extends ConsumerStatefulWidget {
  const EmailAuthForm({super.key, required this.isRegister});
  final bool isRegister;

  @override
  ConsumerState<EmailAuthForm> createState() => _EmailAuthFormState();
}

class _EmailAuthFormState extends ConsumerState<EmailAuthForm> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _showPassword = false;
  bool _pending = false;
  String? _emailError;
  String? _passwordError;
  String? _serverError;
  bool _confirmSent = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit(AuthStrings t) async {
    final email = _email.text.trim();
    final password = _password.text;
    setState(() {
      _emailError = email.isEmpty
          ? t.emailRequired
          : (_emailPattern.hasMatch(email) ? null : t.emailInvalid);
      _passwordError = password.isEmpty
          ? t.passwordRequired
          : (password.length < 6 ? t.passwordTooShort : null);
      _serverError = null;
      _confirmSent = false;
    });
    if (_emailError != null || _passwordError != null) return;

    FocusScope.of(context).unfocus();
    setState(() => _pending = true);
    final auth = Supabase.instance.client.auth;
    try {
      if (widget.isRegister) {
        final res = await auth.signUp(email: email, password: password);
        if (res.session == null && mounted) setState(() => _confirmSent = true);
      } else {
        await auth.signInWithPassword(email: email, password: password);
      }
    } on AuthException catch (e) {
      if (mounted) setState(() => _serverError = e.message);
    } catch (_) {
      if (mounted) setState(() => _serverError = t.signInFailed);
    } finally {
      if (mounted) setState(() => _pending = false);
    }
  }

  InputDecoration _decoration(BuildContext context, String hint, String? error, {Widget? suffix}) {
    final colors = context.colors;
    final focus = Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3);
    OutlineInputBorder pill(Color? color) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: color == null ? BorderSide.none : BorderSide(color: color),
        );
    return InputDecoration(
      hintText: hint,
      errorText: error,
      suffixIcon: suffix,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      border: pill(null),
      enabledBorder: pill(colors.border),
      focusedBorder: pill(focus),
      errorBorder: pill(colors.expense),
      focusedErrorBorder: pill(colors.expense),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(authStrings);
    final colors = context.colors;
    final submitLabel = widget.isRegister
        ? (_pending ? t.creatingAccount : t.createAccount)
        : (_pending ? t.signingIn : t.continueLabel);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.email],
              onChanged: (_) {
                if (_emailError != null) setState(() => _emailError = null);
              },
              decoration: _decoration(context, t.emailPlaceholder, _emailError),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _password,
              obscureText: !_showPassword,
              autocorrect: false,
              enableSuggestions: false,
              textInputAction: TextInputAction.done,
              autofillHints: [widget.isRegister ? AutofillHints.newPassword : AutofillHints.password],
              onChanged: (_) {
                if (_passwordError != null) setState(() => _passwordError = null);
              },
              onSubmitted: (_) => _pending ? null : _submit(t),
              decoration: _decoration(
                context,
                widget.isRegister ? t.newPasswordPlaceholder : t.passwordPlaceholder,
                _passwordError,
                suffix: IconButton(
                  tooltip: _showPassword ? t.hidePassword : t.showPassword,
                  color: colors.muted,
                  icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20),
                  onPressed: () => setState(() => _showPassword = !_showPassword),
                ),
              ),
            ),
            if (_serverError != null || _confirmSent) ...[
              const SizedBox(height: 12),
              AuthNotice(
                message: _serverError ?? t.checkEmail,
                color: _serverError != null ? colors.expense : colors.success,
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _pending ? null : () => _submit(t),
              child: Text(submitLabel),
            ),
          ],
        ),
      ),
    );
  }
}

class AuthNotice extends StatelessWidget {
  const AuthNotice({super.key, required this.message, required this.color});
  final String message;
  final Color color;

  @override
  Widget build(BuildContext context) => Text(
        message,
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 14, color: color),
      );
}

/// Returns an error message, or null once the browser has opened.
Future<String?> startGoogleSignIn(AuthStrings t) async {
  try {
    final launched = await Supabase.instance.client.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: Env.authRedirect,
      authScreenLaunchMode: LaunchMode.externalApplication,
    );
    return launched ? null : t.signInFailed;
  } on AuthException catch (e) {
    return e.message;
  } catch (_) {
    return t.signInFailed;
  }
}

class GoogleButton extends StatelessWidget {
  const GoogleButton({super.key, required this.label, required this.onPressed});
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final fg = Theme.of(context).colorScheme.onSurface;
    return FilledButton(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: colors.surface2,
        foregroundColor: fg,
        disabledBackgroundColor: colors.surface2.withValues(alpha: 0.6),
        disabledForegroundColor: fg.withValues(alpha: 0.6),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox.square(dimension: 22, child: CustomPaint(painter: _GoogleLogoPainter())),
          const SizedBox(width: 10),
          Flexible(child: Text(label, overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  const _GoogleLogoPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * 0.2;
    final rect = Rect.fromCircle(center: size.center(Offset.zero), radius: (size.width - stroke) / 2);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke;
    const deg = math.pi / 180;
    void arc(Color color, double start, double sweep) =>
        canvas.drawArc(rect, start * deg, sweep * deg, false, paint..color = color);

    arc(const Color(0xFFEA4335), -150, 105);
    arc(const Color(0xFFFBBC05), 150, 60);
    arc(const Color(0xFF34A853), 45, 105);
    arc(const Color(0xFF4285F4), -10, 55);
    canvas.drawRect(
      Rect.fromLTWH(size.width / 2, size.height / 2 - stroke / 2, size.width / 2 - stroke / 4, stroke),
      Paint()..color = const Color(0xFF4285F4),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// "Don't have an account? Sign Up" line under the actions.
class AuthFooterLink extends StatelessWidget {
  const AuthFooterLink({super.key, required this.prompt, required this.action, required this.onTap});
  final String prompt;
  final String action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Wrap(
        alignment: WrapAlignment.center,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          Text('$prompt ', style: TextStyle(fontSize: 14, color: colors.muted)),
          GestureDetector(
            onTap: onTap,
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(action, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }
}

/// Shows the web's "sign-in failed" message when the OAuth deep link errors.
StreamSubscription<AuthState> listenForOAuthErrors(void Function() onError) =>
    Supabase.instance.client.auth.onAuthStateChange.listen((_) {}, onError: (_) => onError());

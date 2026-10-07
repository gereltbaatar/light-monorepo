import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../core/theme.dart';

/// Leaves room for the floating bottom nav.
const navClearance = 110.0;

class ProfileAvatar extends StatelessWidget {
  const ProfileAvatar({super.key, required this.url, required this.size});

  final String? url;
  final double size;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final fallback = Icon(Icons.person_rounded, size: size * 0.55, color: colors.muted);
    return Container(
      width: size,
      height: size,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(color: colors.surface2, shape: BoxShape.circle),
      child: url == null || url!.isEmpty
          ? fallback
          : CachedNetworkImage(
              imageUrl: url!,
              fit: BoxFit.cover,
              errorWidget: (_, _, _) => fallback,
            ),
    );
  }
}

/// Rounded surface card with inset dividers between rows.
class SettingsGroup extends StatelessWidget {
  const SettingsGroup({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Material(
      color: colors.surface,
      borderRadius: BorderRadius.circular(24),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            children[i],
            if (i < children.length - 1)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Divider(),
              ),
          ],
        ],
      ),
    );
  }
}

class SettingsRow extends StatelessWidget {
  const SettingsRow({
    super.key,
    required this.title,
    required this.onTap,
    this.leading,
    this.rightLabel,
    this.trailing,
    this.showChevron = true,
    this.color,
  });

  final String title;
  final VoidCallback? onTap;
  final Widget? leading;
  final String? rightLabel;
  final Widget? trailing;
  final bool showChevron;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return InkWell(
      onTap: onTap,
      highlightColor: colors.surface2,
      child: SizedBox(
        height: 60,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              if (leading != null) ...[
                IconTheme.merge(
                  data: IconThemeData(size: 20, color: color ?? colors.muted),
                  child: leading!,
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: color),
                ),
              ),
              if (rightLabel != null) ...[
                const SizedBox(width: 8),
                Text(
                  rightLabel!,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: colors.muted),
                ),
              ],
              ?trailing,
              if (showChevron) ...[
                const SizedBox(width: 8),
                Icon(Icons.chevron_right_rounded, size: 22, color: colors.muted),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Back chevron with a centered title, like the web SettingsPageHeader.
class SettingsScaffold extends StatelessWidget {
  const SettingsScaffold({super.key, required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final foreground = Theme.of(context).colorScheme.onSurface;
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.only(bottom: navClearance),
          children: [
            SizedBox(
              height: 84,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Positioned(
                    left: 8,
                    child: IconButton(
                      onPressed: () => Navigator.of(context).maybePop(),
                      tooltip: MaterialLocalizations.of(context).backButtonTooltip,
                      icon: Icon(Icons.chevron_left_rounded, size: 34, color: foreground),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 56),
                    child: Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.5),
                    ),
                  ),
                ],
              ),
            ),
            ...children,
          ],
        ),
      ),
    );
  }
}

class CheckMark extends StatelessWidget {
  const CheckMark({super.key});

  @override
  Widget build(BuildContext context) =>
      Icon(Icons.check_rounded, size: 22, color: Theme.of(context).colorScheme.onSurface);
}

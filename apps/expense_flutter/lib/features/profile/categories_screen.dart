import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/categories.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import 'profile_strings.dart';
import 'settings_widgets.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tr(profileStrings);
    final labels = ref.tr(categoryLabels);

    return SettingsScaffold(
      title: t.categories,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _CategoryGrid(title: t.expense, categories: expenseCategories, labels: labels),
              const SizedBox(height: 32),
              _CategoryGrid(title: t.income, categories: incomeCategories, labels: labels),
            ],
          ),
        ),
      ],
    );
  }
}

class _CategoryGrid extends StatelessWidget {
  const _CategoryGrid({required this.title, required this.categories, required this.labels});

  final String title;
  final List<Category> categories;
  final Map<Category, String> labels;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title.toUpperCase(),
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, letterSpacing: 0.6, color: colors.muted),
        ),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 3,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.78,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.zero,
          children: [
            for (final category in categories)
              Column(
                children: [
                  AspectRatio(
                    aspectRatio: 1,
                    child: Container(
                      decoration: BoxDecoration(
                        color: colors.surface2,
                        borderRadius: BorderRadius.circular(28),
                      ),
                      child: FractionallySizedBox(
                        widthFactor: 0.62,
                        heightFactor: 0.62,
                        child: Image.asset(category.asset, fit: BoxFit.contain),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    labels[category]!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
          ],
        ),
      ],
    );
  }
}

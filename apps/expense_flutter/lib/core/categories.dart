import 'i18n.dart';

enum Category { food, coffee, shopping, taxi, entertainment, bills, health, salary, gift, other }

extension CategoryX on Category {
  String get asset => 'assets/categories/$name.png';
}

Category categoryFrom(Object? raw) =>
    Category.values.firstWhere((c) => c.name == raw, orElse: () => Category.other);

/// Salary and gift are income-only, so expenses never pick them.
const expenseCategories = [
  Category.food,
  Category.coffee,
  Category.shopping,
  Category.taxi,
  Category.entertainment,
  Category.bills,
  Category.health,
  Category.other,
];

const incomeCategories = [Category.salary, Category.gift, Category.other];

const Dict<Map<Category, String>> categoryLabels = (
  en: {
    Category.food: 'Food',
    Category.coffee: 'Coffee',
    Category.shopping: 'Shopping',
    Category.taxi: 'Taxi',
    Category.entertainment: 'Entertainment',
    Category.bills: 'Bills',
    Category.health: 'Health',
    Category.salary: 'Salary',
    Category.gift: 'Gift',
    Category.other: 'Other',
  },
  mn: {
    Category.food: 'Хоол хүнс',
    Category.coffee: 'Кофе',
    Category.shopping: 'Дэлгүүр',
    Category.taxi: 'Такси',
    Category.entertainment: 'Зугаа цэнгэл',
    Category.bills: 'Төлбөр',
    Category.health: 'Эрүүл мэнд',
    Category.salary: 'Цалин',
    Category.gift: 'Бэлэг',
    Category.other: 'Бусад',
  },
);

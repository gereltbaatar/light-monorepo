import '../../core/i18n.dart';

class ProfileStrings {
  const ProfileStrings({
    required this.general,
    required this.categories,
    required this.language,
    required this.appearance,
    required this.signOut,
    required this.signOutConfirm,
    required this.cancel,
    required this.themeSystem,
    required this.themeLight,
    required this.themeDark,
    required this.allTransactions,
    required this.allTime,
    required this.monthTransactions,
    required this.spent,
    required this.lastLogin,
    required this.justNow,
    required this.minutesAgo,
    required this.hoursAgo,
    required this.daysAgo,
    required this.profileUpdated,
    required this.name,
    required this.namePlaceholder,
    required this.save,
    required this.email,
    required this.emailLocked,
    required this.nameEmpty,
    required this.nameTooLong,
    required this.saveFailed,
    required this.expense,
    required this.income,
    required this.languageHint,
  });

  final String general;
  final String categories;
  final String language;
  final String appearance;
  final String signOut;
  final String signOutConfirm;
  final String cancel;
  final String themeSystem;
  final String themeLight;
  final String themeDark;
  final String allTransactions;
  final String allTime;
  final String monthTransactions;
  final String Function(String amount) spent;
  final String lastLogin;
  final String justNow;
  final String Function(int n) minutesAgo;
  final String Function(int n) hoursAgo;
  final String Function(int n) daysAgo;
  final String profileUpdated;
  final String name;
  final String namePlaceholder;
  final String save;
  final String email;
  final String emailLocked;
  final String nameEmpty;
  final String nameTooLong;
  final String saveFailed;
  final String expense;
  final String income;
  final String languageHint;
}

String _enPlural(int n, String unit) => '$n $unit${n > 1 ? 's' : ''} ago';

const Dict<ProfileStrings> profileStrings = (
  en: ProfileStrings(
    general: 'General settings',
    categories: 'Categories',
    language: 'Language',
    appearance: 'Appearance',
    signOut: 'Sign out',
    signOutConfirm: 'Are you sure you want to sign out?',
    cancel: 'Cancel',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    allTransactions: 'All Transactions',
    allTime: 'all time',
    monthTransactions: 'This Month',
    spent: _enSpent,
    lastLogin: 'Last Login',
    justNow: 'Just now',
    minutesAgo: _enMinutes,
    hoursAgo: _enHours,
    daysAgo: _enDays,
    profileUpdated: 'Profile updated',
    name: 'Name',
    namePlaceholder: 'Your name',
    save: 'Save',
    email: 'Email',
    emailLocked: 'Email cannot be changed.',
    nameEmpty: 'Name cannot be empty',
    nameTooLong: 'Name must be 60 characters or fewer',
    saveFailed: 'Could not save',
    expense: 'Expense',
    income: 'Income',
    languageHint: 'The app and AI answers use this language.',
  ),
  mn: ProfileStrings(
    general: 'Ерөнхий тохиргоо',
    categories: 'Ангилал',
    language: 'Хэл',
    appearance: 'Харагдах байдал',
    signOut: 'Гарах',
    signOutConfirm: 'Та системээс гарахдаа итгэлтэй байна уу?',
    cancel: 'Болих',
    themeSystem: 'Систем',
    themeLight: 'Цайвар',
    themeDark: 'Бараан',
    allTransactions: 'Бүх гүйлгээ',
    allTime: 'анхнаасаа',
    monthTransactions: 'Энэ сарын гүйлгээ',
    spent: _mnSpent,
    lastLogin: 'Сүүлд нэвтэрсэн',
    justNow: 'Дөнгөж сая',
    minutesAgo: _mnMinutes,
    hoursAgo: _mnHours,
    daysAgo: _mnDays,
    profileUpdated: 'Профайл шинэчлэгдлээ',
    name: 'Нэр',
    namePlaceholder: 'Таны нэр',
    save: 'Хадгалах',
    email: 'Имэйл',
    emailLocked: 'Имэйлийг өөрчлөх боломжгүй.',
    nameEmpty: 'Нэр хоосон байж болохгүй',
    nameTooLong: 'Нэр 60 тэмдэгтээс ихгүй байх ёстой',
    saveFailed: 'Хадгалж чадсангүй',
    expense: 'Зарлага',
    income: 'Орлого',
    languageHint: 'Апп болон AI-ийн хариулт энэ хэлээр харагдана.',
  ),
);

String _enSpent(String amount) => '$amount spent';
String _enMinutes(int n) => _enPlural(n, 'min');
String _enHours(int n) => _enPlural(n, 'hour');
String _enDays(int n) => _enPlural(n, 'day');
String _mnSpent(String amount) => '$amount зарлага';
String _mnMinutes(int n) => '$n мин өмнө';
String _mnHours(int n) => '$n цагийн өмнө';
String _mnDays(int n) => '$n өдрийн өмнө';

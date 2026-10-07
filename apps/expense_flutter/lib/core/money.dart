import 'package:intl/intl.dart';

final _grouped = NumberFormat('#,##0', 'en_US');

/// "₮15,260" — same output as the web moneyFormatter.
String money(num amount) {
  final rounded = amount.round();
  return '${rounded < 0 ? '-' : ''}₮${_grouped.format(rounded.abs())}';
}

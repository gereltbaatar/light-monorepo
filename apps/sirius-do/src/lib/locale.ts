import { formatDay, type Day } from "@workspace/sirius-core/lib/date";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { weekdayOf } from "@/lib/time";

const MN_WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
const MN_WEEKDAYS_SHORT = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

// Browsers often ship without Mongolian Intl data and fall back to English.
function formatMongolian(day: Day, options: Intl.DateTimeFormatOptions): string {
  const [year, month, date] = day.split("-").map(Number) as [number, number, number];
  const weekday = weekdayOf(day);
  const parts: string[] = [];

  if (options.year) parts.push(`${year} оны`);
  if (options.month) parts.push(options.day ? `${month}-р сарын` : `${month}-р сар`);
  if (options.day) parts.push(options.day === "2-digit" ? String(date).padStart(2, "0") : String(date));

  const rest = parts.join(" ");
  if (!options.weekday) return rest;

  const name = options.weekday === "long" ? MN_WEEKDAYS[weekday]! : MN_WEEKDAYS_SHORT[weekday]!;
  return rest ? `${name}, ${rest}` : name;
}

export function formatDate(day: Day, options: Intl.DateTimeFormatOptions, locale: Locale): string {
  if (locale === "mn") return formatMongolian(day, options);
  return formatDay(day, options, INTL_LOCALE[locale]);
}

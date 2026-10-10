import { formatDay, type Day } from "@workspace/sirius-core/lib/date";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";

export function formatDate(day: Day, options: Intl.DateTimeFormatOptions, locale: Locale): string {
  return formatDay(day, options, INTL_LOCALE[locale]);
}

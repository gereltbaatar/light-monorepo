import { formatDay, type Day } from "@workspace/sirius-core/lib/date";

export const LOCALE = "mn-MN";

export function formatDate(day: Day, options: Intl.DateTimeFormatOptions): string {
  return formatDay(day, options, LOCALE);
}

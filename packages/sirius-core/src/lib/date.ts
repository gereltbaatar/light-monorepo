/** yyyy-mm-dd */
export type Day = string;

export const DEFAULT_TIMEZONE = "Asia/Ulaanbaatar";

export function todayIn(timezone: string = DEFAULT_TIMEZONE): Day {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

// Noon UTC keeps day arithmetic clear of DST edges.
function toDate(day: Day): Date {
  return new Date(`${day}T12:00:00Z`);
}

function toDay(date: Date): Day {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: Day, amount: number): Day {
  const date = toDate(day);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDay(date);
}

export interface DayRange {
  start: Day;
  end: Day;
}

export function weekRange(day: Day, weekStartsOn = 1): DayRange {
  const offset = (toDate(day).getUTCDay() - weekStartsOn + 7) % 7;
  const start = addDays(day, -offset);
  return { start, end: addDays(start, 6) };
}

export function monthRange(day: Day): DayRange {
  const date = toDate(day);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12));
  return { start: toDay(start), end: toDay(end) };
}

export function daysBetween(range: DayRange): Day[] {
  const days: Day[] = [];
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) days.push(d);
  return days;
}

export function formatDay(day: Day, options: Intl.DateTimeFormatOptions, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...options }).format(toDate(day));
}

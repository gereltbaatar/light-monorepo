import "server-only";

import { createClient } from "../supabase/server";
import { getClock } from "../lib/auth";
import type { Day, DayRange } from "../lib/date";
import type { CalendarItem, Profile } from "../lib/types";
import { getDoSummary, type DoSummary } from "./do";
import { getFitSummary, type FitSummary } from "./fit";
import { getMoneySummary, type MoneySummary } from "./money";

export async function getCalendarItems(range: DayRange): Promise<CalendarItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("life_calendar_items")
    .select("kind, id, title, day, at_time, done")
    .gte("day", range.start)
    .lte("day", range.end)
    .order("day")
    .order("at_time", { nullsFirst: true });

  return (data ?? []) as CalendarItem[];
}

export interface LifeSummary {
  profile: Profile | null;
  today: Day;
  week: DayRange;
  month: DayRange;
  do: DoSummary;
  fit: FitSummary;
  money: MoneySummary;
  calendar: CalendarItem[];
}

// One parallel read across every domain for the dashboard.
export async function getLifeSummary(): Promise<LifeSummary> {
  const { profile, today, week, month } = await getClock();

  const [doSummary, fit, money, calendar] = await Promise.all([
    getDoSummary(today, week),
    getFitSummary(today, month),
    getMoneySummary(month),
    getCalendarItems(month),
  ]);

  return { profile, today, week, month, do: doSummary, fit, money, calendar };
}

import "server-only";

import { createClient } from "../supabase/server";
import { addDays, type Day, type DayRange } from "../lib/date";
import { ratio } from "../lib/format";
import type { BodyMetric, PersonalRecord, Workout } from "../lib/types";

const WORKOUT_COLUMNS = "id, title, scheduled_on, status, started_at, ended_at";

export async function getWorkouts(range: DayRange): Promise<Workout[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fit_workouts")
    .select(WORKOUT_COLUMNS)
    .gte("scheduled_on", range.start)
    .lte("scheduled_on", range.end)
    .order("scheduled_on");

  return (data ?? []) as Workout[];
}

export async function getRecentWorkouts(limit = 30): Promise<Workout[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fit_workouts")
    .select(WORKOUT_COLUMNS)
    .eq("status", "completed")
    .order("scheduled_on", { ascending: false })
    .limit(limit);

  return (data ?? []) as Workout[];
}

export async function getPersonalRecords(limit = 10): Promise<PersonalRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fit_personal_records")
    .select("exercise_id, exercise_name, weight_kg, reps, estimated_1rm, achieved_on")
    .order("estimated_1rm", { ascending: false })
    .limit(limit);

  // numeric arrives as a string from PostgREST.
  return (data ?? []).map((row) => ({
    ...row,
    weight_kg: Number(row.weight_kg),
    estimated_1rm: Number(row.estimated_1rm),
  })) as PersonalRecord[];
}

export async function getBodyMetrics(range: DayRange): Promise<BodyMetric[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fit_body_metrics")
    .select("measured_on, weight_kg, body_fat_pct")
    .gte("measured_on", range.start)
    .lte("measured_on", range.end)
    .order("measured_on");

  return (data ?? []).map((row) => ({
    measured_on: row.measured_on,
    weight_kg: row.weight_kg === null ? null : Number(row.weight_kg),
    body_fat_pct: row.body_fat_pct === null ? null : Number(row.body_fat_pct),
  }));
}

// Consecutive training days ending today, or yesterday if today is still open.
export function workoutStreak(completedDays: Set<Day>, today: Day): number {
  let day = completedDays.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (completedDays.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

export interface FitSummary {
  today: Workout[];
  month: { completed: number; scheduled: number; consistency: number | null };
  streak: number;
  weight: { current: number | null; change: number | null };
}

export async function getFitSummary(today: Day, month: DayRange): Promise<FitSummary> {
  const lookback = { start: addDays(today, -120), end: month.end };
  const [workouts, metrics] = await Promise.all([
    getWorkouts(lookback),
    getBodyMetrics({ start: addDays(today, -30), end: today }),
  ]);

  const completed = new Set(workouts.filter((w) => w.status === "completed").map((w) => w.scheduled_on));
  const inMonth = workouts.filter((w) => w.scheduled_on >= month.start && w.scheduled_on <= month.end);
  const dueSoFar = inMonth.filter((w) => w.scheduled_on <= today);
  const doneInMonth = inMonth.filter((w) => w.status === "completed").length;

  const weights = metrics.map((m) => m.weight_kg).filter((w): w is number => w !== null);
  const current = weights.at(-1) ?? null;

  return {
    today: workouts.filter((w) => w.scheduled_on === today),
    month: {
      completed: doneInMonth,
      scheduled: inMonth.length,
      consistency: ratio(dueSoFar.filter((w) => w.status === "completed").length, dueSoFar.length),
    },
    streak: workoutStreak(completed, today),
    weight: { current, change: current !== null && weights.length > 1 ? current - weights[0]! : null },
  };
}

import type { Day } from "./date";

// Hand-written row shapes; swap for `supabase gen types` once the schema settles.

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  currency: string;
  week_starts_on: number;
}

export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category_id: string | null;
  series_id: string | null;
  due_date: Day | null;
  due_time: string | null;
  completed_at: string | null;
}

export type WorkoutStatus = "planned" | "completed" | "skipped";

export interface Workout {
  id: string;
  title: string;
  scheduled_on: Day;
  status: WorkoutStatus;
  started_at: string | null;
  ended_at: string | null;
}

export interface BodyMetric {
  measured_on: Day;
  weight_kg: number | null;
  body_fat_pct: number | null;
}

export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  estimated_1rm: number;
  achieved_on: Day;
}

export type TransactionType = "income" | "expense";

export interface MoneyTransaction {
  id: string;
  type: TransactionType;
  /** Positive magnitude; direction lives in `type`. */
  amount: number;
  title: string;
  occurred_at: Day;
  category: string;
}

export type CalendarItemKind = "task" | "event" | "workout";

export interface CalendarItem {
  kind: CalendarItemKind;
  id: string;
  title: string;
  day: Day;
  at_time: string | null;
  done: boolean;
}

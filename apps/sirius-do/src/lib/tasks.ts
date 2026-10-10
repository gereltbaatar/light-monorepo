import "server-only";

import { cache } from "react";
import { createClient } from "@workspace/sirius-core/supabase/server";
import { ratio } from "@workspace/sirius-core/lib/format";
import type { Day, DayRange } from "@workspace/sirius-core/lib/date";
import { DEFAULT_CATEGORIES } from "./categories";
import type { Category, Task } from "./types";

const COLUMNS = "id, title, notes, status, priority, due_date, due_time, duration_minutes, completed_at, category_id";

export async function getTasksDue(range: DayRange): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("do_tasks")
    .select(COLUMNS)
    .gte("due_date", range.start)
    .lte("due_date", range.end)
    .order("due_date")
    .order("due_time", { nullsFirst: false })
    .order("created_at");

  return (data ?? []) as Task[];
}

export async function getOverdueTasks(today: Day): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("do_tasks")
    .select(COLUMNS)
    .lt("due_date", today)
    .eq("status", "todo")
    .order("due_date");

  return (data ?? []) as Task[];
}

export async function getOpenTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("do_tasks")
    .select(COLUMNS)
    .eq("status", "todo")
    .order("due_date", { nullsFirst: false })
    .order("due_time", { nullsFirst: false })
    .order("created_at");

  return (data ?? []) as Task[];
}

export async function getDoneTasks(limit = 50): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("do_tasks")
    .select(COLUMNS)
    .eq("status", "done")
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  return (data ?? []) as Task[];
}

const CATEGORY_COLUMNS = "id, key, name, icon, color, position";

// Defaults can't be deleted, so seeding only happens once per user.
export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("do_categories").select(CATEGORY_COLUMNS).order("position").order("created_at");
  const categories = (data ?? []) as Category[];
  if (categories.some((c) => c.key)) return categories;

  const { data: seeded } = await supabase
    .from("do_categories")
    .upsert(
      DEFAULT_CATEGORIES.map((c, position) => ({ ...c, position })),
      { onConflict: "user_id,key", ignoreDuplicates: true },
    )
    .select(CATEGORY_COLUMNS);

  return [...((seeded ?? []) as Category[]), ...categories].sort((a, b) => a.position - b.position);
});

export interface Progress {
  total: number;
  done: number;
  remaining: number;
  rate: number | null;
}

export function progressOf(tasks: Task[]): Progress {
  const done = tasks.filter((t) => t.status === "done").length;
  return { total: tasks.length, done, remaining: tasks.length - done, rate: ratio(done, tasks.length) };
}

import "server-only";

import { createClient } from "@workspace/sirius-core/supabase/server";
import { ratio } from "@workspace/sirius-core/lib/format";
import type { Day, DayRange } from "@workspace/sirius-core/lib/date";
import type { Task } from "./types";

const COLUMNS = "id, title, notes, status, priority, due_date, due_time, duration_minutes, completed_at";

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

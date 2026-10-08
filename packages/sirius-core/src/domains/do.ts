import "server-only";

import { createClient } from "../supabase/server";
import { ratio } from "../lib/format";
import type { Day, DayRange } from "../lib/date";
import type { Task } from "../lib/types";

const TASK_COLUMNS =
  "id, title, notes, status, priority, category_id, series_id, due_date, due_time, completed_at";

export async function getTasksDue(range: DayRange): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("do_tasks")
    .select(TASK_COLUMNS)
    .gte("due_date", range.start)
    .lte("due_date", range.end)
    .neq("status", "cancelled")
    .order("due_date")
    .order("due_time", { nullsFirst: false })
    .order("position");

  return (data ?? []) as Task[];
}

export async function getOverdueTasks(today: Day): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("do_tasks")
    .select(TASK_COLUMNS)
    .lt("due_date", today)
    .in("status", ["todo", "in_progress"])
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

export interface DoSummary {
  today: Progress;
  week: Progress;
  todayTasks: Task[];
  overdue: Task[];
}

export async function getDoSummary(today: Day, week: DayRange): Promise<DoSummary> {
  const [weekTasks, overdue] = await Promise.all([getTasksDue(week), getOverdueTasks(today)]);
  const todayTasks = weekTasks.filter((t) => t.due_date === today);

  return { today: progressOf(todayTasks), week: progressOf(weekTasks), todayTasks, overdue };
}

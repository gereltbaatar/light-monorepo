"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@workspace/sirius-core/supabase/server";
import type { Day } from "@workspace/sirius-core/lib/date";
import { getT } from "@/lib/i18n/server";
import { PRIORITIES, type TaskPriority } from "@/lib/types";

export type TaskActionResult = { error: string } | { ok: true } | undefined;

function field(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function createTask(_prev: TaskActionResult, formData: FormData): Promise<TaskActionResult> {
  const title = field(formData, "title");
  if (!title) return { error: (await getT()).errors.titleRequired };

  const duration = Number(field(formData, "duration_minutes"));
  const supabase = await createClient();
  const { error } = await supabase.from("do_tasks").insert({
    title,
    due_date: field(formData, "due_date"),
    due_time: field(formData, "due_time"),
    duration_minutes: duration > 0 ? Math.round(duration) : null,
    priority: PRIORITIES.find((p) => p === field(formData, "priority")) ?? "medium",
    category_id: field(formData, "category_id"),
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export interface NewTask {
  title: string;
  dueDate: Day | null;
  dueTime: string | null;
  durationMinutes: number | null;
  priority: TaskPriority;
  categoryId: string | null;
}

export async function createTasks(tasks: NewTask[]): Promise<{ error: string } | { ids: string[] }> {
  const rows = tasks
    .filter((task) => task.title?.trim())
    .map((task) => ({
      title: task.title.trim(),
      due_date: task.dueDate,
      due_time: task.dueTime,
      duration_minutes: task.durationMinutes && task.durationMinutes > 0 ? Math.round(task.durationMinutes) : null,
      priority: PRIORITIES.find((p) => p === task.priority) ?? "medium",
      category_id: task.categoryId,
    }));
  if (rows.length === 0) return { error: (await getT()).errors.titleRequired };

  const supabase = await createClient();
  const { data, error } = await supabase.from("do_tasks").insert(rows).select("id");
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ids: data.map((row) => row.id as string) };
}

export async function setTaskDone(taskId: string, done: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("do_tasks")
    .update({ status: done ? "done" : "todo" })
    .eq("id", taskId);

  revalidatePath("/", "layout");
}

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("do_tasks").delete().eq("id", taskId);

  revalidatePath("/", "layout");
}

export async function moveTask(taskId: string, day: Day): Promise<void> {
  const supabase = await createClient();
  await supabase.from("do_tasks").update({ due_date: day }).eq("id", taskId);

  revalidatePath("/", "layout");
}

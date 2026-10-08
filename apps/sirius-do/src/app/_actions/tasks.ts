"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@workspace/sirius-core/supabase/server";
import type { Day } from "@workspace/sirius-core/lib/date";
import { PRIORITIES } from "@/lib/types";

export type TaskActionResult = { error: string } | { ok: true } | undefined;

function field(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function createTask(_prev: TaskActionResult, formData: FormData): Promise<TaskActionResult> {
  const title = field(formData, "title");
  if (!title) return { error: "Гарчиг оруулна уу." };

  const duration = Number(field(formData, "duration_minutes"));
  const supabase = await createClient();
  const { error } = await supabase.from("do_tasks").insert({
    title,
    due_date: field(formData, "due_date"),
    due_time: field(formData, "due_time"),
    duration_minutes: duration > 0 ? Math.round(duration) : null,
    priority: PRIORITIES.find((p) => p === field(formData, "priority")) ?? "medium",
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
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

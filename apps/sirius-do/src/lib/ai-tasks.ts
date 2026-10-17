import "server-only";

import { Type } from "@google/genai";
import { getClock } from "@workspace/sirius-core/lib/auth";
import type { Day } from "@workspace/sirius-core/lib/date";
import { errorStatus } from "@workspace/sirius-core/lib/gemini";
import { categoryName } from "@/lib/categories";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { getCategories } from "@/lib/tasks";
import { PRIORITIES, type TaskPriority } from "@/lib/types";

export interface VoiceTask {
  title: string;
  dueDate: Day | null;
  dueTime: string | null;
  durationMinutes: number | null;
  priority: TaskPriority;
  categoryId: string | null;
}

export interface ParsedVoice {
  /** What the model heard or read, shown back so the user can tell it understood. */
  heard: string;
  tasks: VoiceTask[];
  /** False when a title was unclear; the UI then asks instead of saving. */
  confident: boolean;
}

export const MAX_TASKS = 10;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const TASK_FIELD_RULES = `- One task per separate thing to do. At most ${MAX_TASKS} tasks.
- title: short, capitalized, in the source language. Never include the date, time or duration in it.
- dueDate: yyyy-mm-dd. Resolve "өнөөдөр"/today, "маргааш"/tomorrow, "нөгөөдөр", weekday names against the given today date.
  Empty string when no day was given.
- dueTime: HH:mm in 24h. "орой 8" = 20:00, "өглөө 7" = 07:00, "үдээс хойш 3" = 15:00. Empty string when no time was given.
- durationMinutes: 0 when no duration was given. "1 цаг" = 60, "хагас цаг" = 30.
- priority: urgent for "яаралтай"/urgent, high for "чухал"/important, low for "хамаагүй"/"заавал биш", otherwise medium.
- categoryId: the id of the best matching category from the given list, or empty string when none fits.
- confident=false if any title was unclear or you had to guess what the task is.`;

export const TASKS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    heard: { type: Type.STRING },
    confident: { type: Type.BOOLEAN },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          dueDate: { type: Type.STRING },
          dueTime: { type: Type.STRING },
          durationMinutes: { type: Type.NUMBER },
          priority: { type: Type.STRING, enum: [...PRIORITIES] },
          categoryId: { type: Type.STRING },
        },
        required: ["title", "dueDate", "dueTime", "durationMinutes", "priority", "categoryId"],
      },
    },
  },
  required: ["heard", "confident", "tasks"],
};

type RawTask = Partial<Record<keyof VoiceTask, unknown>>;

function toTask(raw: RawTask, categoryIds: Set<string>): VoiceTask {
  const duration = Math.round(Number(raw.durationMinutes));
  const date = String(raw.dueDate ?? "");
  const time = String(raw.dueTime ?? "");
  const categoryId = String(raw.categoryId ?? "");
  return {
    title: String(raw.title ?? "").trim(),
    dueDate: DATE_PATTERN.test(date) ? date : null,
    dueTime: TIME_PATTERN.test(time) ? time : null,
    durationMinutes: Number.isFinite(duration) && duration > 0 ? Math.min(duration, 24 * 60) : null,
    priority: PRIORITIES.find((p) => p === raw.priority) ?? "medium",
    categoryId: categoryIds.has(categoryId) ? categoryId : null,
  };
}

// Today's date and the user's categories, as the prompt and validation need them.
export async function taskContext(dictionary: Dictionary) {
  const [{ today }, categories] = await Promise.all([getClock(), getCategories()]);
  const weekday = WEEKDAYS[new Date(`${today}T12:00:00Z`).getUTCDay()];
  const categoryList = categories.map((c) => `${c.id}: ${categoryName(c, dictionary)}`).join("\n");

  return {
    prompt: `Today is ${today} (${weekday}).\nCategories:\n${categoryList || "(none)"}`,
    categoryIds: new Set(categories.map((c) => c.id)),
  };
}

export function readTasks(text: string | undefined, categoryIds: Set<string>): ParsedVoice {
  const parsed = JSON.parse(text ?? "{}") as { heard?: string; confident?: boolean; tasks?: unknown };
  const tasks = (Array.isArray(parsed.tasks) ? (parsed.tasks as RawTask[]) : [])
    .slice(0, MAX_TASKS)
    .map((raw) => toTask(raw, categoryIds))
    .filter((task) => task.title);

  return { heard: parsed.heard?.trim() ?? "", tasks, confident: parsed.confident === true };
}

export function aiErrorMessage(error: unknown, t: Dictionary["voice"]): string {
  const status = errorStatus(error);
  if (status === 503) return t.aiBusy;
  if (status === 429) return t.aiQuota;
  const message = error instanceof Error ? error.message : String(error);
  return t.aiFailed(message.slice(0, 200));
}

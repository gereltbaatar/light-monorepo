"use server";

import { Type } from "@google/genai";
import { createClient } from "@workspace/sirius-core/supabase/server";
import { getClock } from "@workspace/sirius-core/lib/auth";
import type { Day } from "@workspace/sirius-core/lib/date";
import { isAiFeatureEnabled } from "@workspace/sirius-core/lib/ai-settings";
import { errorStatus, generateWithFallback, getGemini } from "@workspace/sirius-core/lib/gemini";
import { categoryName } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
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
  /** What the model heard, shown back so the user can tell it understood. */
  heard: string;
  tasks: VoiceTask[];
  /** False when a title was unclear; the UI then asks instead of saving. */
  confident: boolean;
}

export type ParseVoiceResult = ParsedVoice | { error: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_AUDIO_BYTES = 6 * 1024 * 1024;
const MAX_TASKS = 10;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SYSTEM_PROMPT = `You turn a short spoken Mongolian (sometimes English) recording into to-do tasks.

Examples:
- "Маргааш 7 цагт тамирт явна, 1 цаг" → title "Тамир", dueDate tomorrow, dueTime "07:00", durationMinutes 60.
- "Өнөөдөр орой 8-д ээж рүү залгах" → title "Ээж рүү залгах", dueDate today, dueTime "20:00".
- "Даваа гарагт тайлан өгөх, яаралтай" → title "Тайлан өгөх", dueDate next Monday, priority urgent.
- "Сүү, талх авах, бас машинаа угаалгах" → two tasks: "Сүү, талх авах" and "Машинаа угаалгах".

RULES
- One task per separate thing to do. At most ${MAX_TASKS} tasks.
- title: short, capitalized, in the language spoken. Never include the date, time or duration in it.
- dueDate: yyyy-mm-dd. Resolve "өнөөдөр"/today, "маргааш"/tomorrow, "нөгөөдөр", weekday names against the given today date.
  Empty string when no day was said.
- dueTime: HH:mm in 24h. "орой 8" = 20:00, "өглөө 7" = 07:00, "үдээс хойш 3" = 15:00. Empty string when no time was said.
- durationMinutes: 0 when no duration was said. "1 цаг" = 60, "хагас цаг" = 30.
- priority: urgent for "яаралтай"/urgent, high for "чухал"/important, low for "хамаагүй"/"заавал биш", otherwise medium.
- categoryId: the id of the best matching category from the given list, or empty string when none fits.
- confident=false if any title was unclear or you had to guess what the task is.

heard: the transcript of what was said, in the original language.
If the recording is silent, unclear or not about tasks, return an empty "tasks" list.`;

const RESPONSE_SCHEMA = {
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

export async function parseVoiceTasks(formData: FormData): Promise<ParseVoiceResult> {
  const supabase = await createClient();
  const dictionary = await getT();
  const t = dictionary.voice;
  if (!(await isAiFeatureEnabled(supabase, "voice"))) return { error: t.disabled };

  const ai = getGemini();
  if (!ai) return { error: t.notConfigured };

  const audio = formData.get("audio");
  if (!(audio instanceof File) || audio.size === 0) return { error: t.noAudio };
  if (audio.size > MAX_AUDIO_BYTES) return { error: t.tooLong };

  const [{ today }, categories] = await Promise.all([getClock(), getCategories()]);
  const weekday = WEEKDAYS[new Date(`${today}T12:00:00Z`).getUTCDay()];
  const categoryList = categories.map((c) => `${c.id}: ${categoryName(c, dictionary)}`).join("\n");

  try {
    const response = await generateWithFallback(supabase, ai, {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "audio/wav",
                data: Buffer.from(await audio.arrayBuffer()).toString("base64"),
              },
            },
            {
              text: `Today is ${today} (${weekday}).\nCategories:\n${categoryList || "(none)"}\nTurn this recording into tasks.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const parsed = JSON.parse(response.text ?? "{}") as { heard?: string; confident?: boolean; tasks?: unknown };
    const ids = new Set(categories.map((c) => c.id));
    const tasks = (Array.isArray(parsed.tasks) ? (parsed.tasks as RawTask[]) : [])
      .slice(0, MAX_TASKS)
      .map((raw) => toTask(raw, ids))
      .filter((task) => task.title);

    if (tasks.length === 0) return { error: t.notUnderstood };

    return { heard: parsed.heard?.trim() ?? "", tasks, confident: parsed.confident === true };
  } catch (error) {
    console.error("[parseVoiceTasks]", error);
    const status = errorStatus(error);
    if (status === 503) return { error: t.aiBusy };
    if (status === 429) return { error: t.aiQuota };
    const message = error instanceof Error ? error.message : String(error);
    return { error: t.aiFailed(message.slice(0, 200)) };
  }
}

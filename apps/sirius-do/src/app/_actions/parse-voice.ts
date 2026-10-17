"use server";

import { createClient } from "@workspace/sirius-core/supabase/server";
import { isAiFeatureEnabled } from "@workspace/sirius-core/lib/ai-settings";
import { generateWithFallback, getGemini } from "@workspace/sirius-core/lib/gemini";
import { TASKS_RESPONSE_SCHEMA, TASK_FIELD_RULES, aiErrorMessage, readTasks, taskContext, type ParsedVoice } from "@/lib/ai-tasks";
import { getT } from "@/lib/i18n/server";

export type { ParsedVoice, VoiceTask } from "@/lib/ai-tasks";

export type ParseVoiceResult = ParsedVoice | { error: string };

const MAX_AUDIO_BYTES = 6 * 1024 * 1024;

const SYSTEM_PROMPT = `You turn a short spoken Mongolian (sometimes English) recording into to-do tasks.

Examples:
- "Маргааш 7 цагт тамирт явна, 1 цаг" → title "Тамир", dueDate tomorrow, dueTime "07:00", durationMinutes 60.
- "Өнөөдөр орой 8-д ээж рүү залгах" → title "Ээж рүү залгах", dueDate today, dueTime "20:00".
- "Даваа гарагт тайлан өгөх, яаралтай" → title "Тайлан өгөх", dueDate next Monday, priority urgent.
- "Сүү, талх авах, бас машинаа угаалгах" → two tasks: "Сүү, талх авах" and "Машинаа угаалгах".

RULES
${TASK_FIELD_RULES}

heard: the transcript of what was said, in the original language.
If the recording is silent, unclear or not about tasks, return an empty "tasks" list.`;

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

  const context = await taskContext(dictionary);

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
              text: `${context.prompt}\nTurn this recording into tasks.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: TASKS_RESPONSE_SCHEMA,
      },
    });

    const parsed = readTasks(response.text, context.categoryIds);
    if (parsed.tasks.length === 0) return { error: t.notUnderstood };
    return parsed;
  } catch (error) {
    console.error("[parseVoiceTasks]", error);
    return { error: aiErrorMessage(error, t) };
  }
}

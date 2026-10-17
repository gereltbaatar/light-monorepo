"use server";

import { createClient } from "@workspace/sirius-core/supabase/server";
import { isAiFeatureEnabled } from "@workspace/sirius-core/lib/ai-settings";
import { generateWithFallback, getGemini } from "@workspace/sirius-core/lib/gemini";
import { TASKS_RESPONSE_SCHEMA, TASK_FIELD_RULES, aiErrorMessage, readTasks, taskContext, type ParsedVoice } from "@/lib/ai-tasks";
import { getT } from "@/lib/i18n/server";

export type ParseImageResult = ParsedVoice | { error: string };

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

const SYSTEM_PROMPT = `You read a photo and turn it into to-do tasks. The photo can be a handwritten or printed list,
a whiteboard, sticky notes, a screenshot of a chat or email, a calendar, or a poster/invitation for an event.
Text is usually Mongolian (Cyrillic, including Ө/ө and Ү/ү) or English.

Examples:
- A handwritten list "сүү, өндөг, талх" → one task "Сүү, өндөг, талх авах" (a shopping list is one task, not one per item).
- A whiteboard "Fri: send report, Mon 10:00 team sync" → "Send report" on Friday, "Team sync" Monday 10:00.
- A wedding invitation "10-р сарын 25, 18:00" → "Хуриманд очих" on that date at 18:00.
- A chat screenshot "маргааш 3 цагт уулзъя" → "Уулзалт" tomorrow 15:00.

RULES
${TASK_FIELD_RULES}
- Ignore crossed-out or ticked-off items.

heard: a one-line summary of what the photo shows, in the photo's language.
If the photo has nothing that reads as a task, return an empty "tasks" list.`;

export async function parseImageTasks(formData: FormData): Promise<ParseImageResult> {
  const supabase = await createClient();
  const dictionary = await getT();
  const t = dictionary.voice;
  const s = dictionary.snap;
  if (!(await isAiFeatureEnabled(supabase, "voice"))) return { error: t.disabled };

  const ai = getGemini();
  if (!ai) return { error: t.notConfigured };

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) return { error: s.noImage };
  if (image.size > MAX_IMAGE_BYTES) return { error: s.tooLarge };
  const mimeType = IMAGE_TYPES.includes(image.type) ? image.type : "image/jpeg";

  const context = await taskContext(dictionary);

  try {
    const response = await generateWithFallback(supabase, ai, {
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: Buffer.from(await image.arrayBuffer()).toString("base64") } },
            { text: `${context.prompt}\nTurn this photo into tasks.` },
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
    if (parsed.tasks.length === 0) return { error: s.notUnderstood };
    return parsed;
  } catch (error) {
    console.error("[parseImageTasks]", error);
    return { error: aiErrorMessage(error, t) };
  }
}

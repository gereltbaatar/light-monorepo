"use server";

import { Type } from "@google/genai";
import { CATEGORY_KEYS, toCategory, type Category } from "@/lib/categories";
import { errorStatus, generateWithFallback, getGemini } from "@workspace/sirius-core/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { sanitizeItems, type ReceiptItem } from "@/lib/receipt-items";
import { getT } from "@/lib/i18n/server";
import { isAiFeatureEnabled } from "@/lib/ai-features-server";
import { aiFeaturesDict } from "@/lib/i18n/dictionaries/ai-features";
import { voiceDict } from "@/lib/i18n/dictionaries/voice";

export interface VoiceEntry {
    type: "expense" | "income";
    title: string;
    amount: number;
    category: Category;
    /** yyyy-mm-dd */
    date: string;
    /** False when the amount or item was unclear; the UI then asks instead of saving. */
    confident: boolean;
    /** Each thing bought in this one transaction; empty when only one was mentioned. */
    items: ReceiptItem[];
}

export interface ParsedVoice {
    /** What the model heard, shown back so the user can tell it understood. */
    heard: string;
    /** One per transaction to save; a single sentence can describe several. */
    entries: VoiceEntry[];
}

export type ParseVoiceResult = ParsedVoice | { error: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AUDIO_BYTES = 6 * 1024 * 1024;
const MAX_ENTRIES = 10;

const SYSTEM_PROMPT = `You turn a short spoken Mongolian (sometimes English) recording into money transactions.

Examples:
- "Өнөөдөр би 5,000 төгрөгөөр тараг авсан" → one expense, title "Тараг", amount 5000, category food, date today.
- "Өчигдөр таксинд 12 мянга өгсөн" → one expense, title "Такси", amount 12000, category taxi, date yesterday.
- "Цалин 2 сая орж ирлээ" → one income, title "Цалин", amount 2000000, category salary.

NUMBERS
- мянга = 1,000, сая = 1,000,000, "5 мянга 500" = 5500, "хорин мянга" = 20000.
- If the speaker corrects themselves ("5 мянга, үгүй 6 мянга"), use the last value.
- "2 кофе тус бүр 5,000" means quantity 2, unitPrice 5000, total 10000. "2 кофе 10,000" means total 10000.

ONE TRANSACTION OR SEVERAL
Return one entry in "transactions" per separate transaction. Decide in this order:
1. The speaker asks to split ("тус тусад нь", "тусад нь", "салгаж", "separately") → one entry per thing.
2. The speaker asks to combine ("нэг баримтаар", "хамт", "нийтдээ", "together") → one entry with items.
3. Things on different dates, or a mix of income and expense → always separate entries.
4. Things from clearly different categories (a taxi and a coffee) → separate entries.
5. Otherwise several things bought together (a grocery list) → one entry, each thing in items.
At most ${MAX_ENTRIES} entries.

EACH ENTRY
- title: the thing bought or the source of money, short, capitalized, in the language spoken. Never include the amount.
  For an entry with several items, join the item names with ", " (at most three, then "+N").
- type: income only for salary, gifts received, money received; otherwise expense.
- category: one of ${CATEGORY_KEYS.join(", ")}. Use "other" when unsure. With several items, the one most money went to.
- date: resolve "өнөөдөр"/today, "өчигдөр"/yesterday, weekday names against the given today date. Default to today.
- items: every thing in this entry with name, quantity (default 1), unitPrice and total. amount is the sum of the totals.
- confident=false for this entry if its amount was not said or was unclear, or a stated total does not match its items.
  Never guess an amount; use 0 instead.

heard: the transcript of what was said, in the original language.
If the recording is silent, unclear or not about money, return an empty "transactions" list.`;

const ENTRY_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ["expense", "income"] },
        title: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        category: { type: Type.STRING, enum: [...CATEGORY_KEYS] },
        date: { type: Type.STRING, description: "yyyy-mm-dd" },
        confident: { type: Type.BOOLEAN },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unitPrice: { type: Type.NUMBER },
                    total: { type: Type.NUMBER },
                },
                required: ["name", "quantity", "unitPrice", "total"],
            },
        },
    },
    required: ["type", "title", "amount", "category", "date", "confident", "items"],
};

const RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        heard: { type: Type.STRING },
        transactions: { type: Type.ARRAY, items: ENTRY_SCHEMA },
    },
    required: ["heard", "transactions"],
};

type RawEntry = Partial<Omit<VoiceEntry, "items">> & { items?: unknown };

function toEntry(raw: RawEntry, todayDate: string, fallbackTitle: string): VoiceEntry {
    const items = sanitizeItems(raw.items);
    const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);
    // The item totals are what was actually said, so they win over the model's own sum.
    const amount = Math.round(items.length > 1 ? itemsTotal : Number(raw.amount));
    const title = raw.title?.trim() ?? "";
    const hasAmount = Number.isFinite(amount) && amount > 0;

    return {
        type: raw.type === "income" ? "income" : "expense",
        title: title || fallbackTitle,
        amount: hasAmount ? amount : 0,
        category: toCategory(raw.category),
        date: raw.date && DATE_PATTERN.test(raw.date) ? raw.date : todayDate,
        confident: raw.confident === true && hasAmount && !!title,
        items: items.length > 1 ? items : [],
    };
}

export async function parseVoiceTransaction(formData: FormData): Promise<ParseVoiceResult> {
    const t = await getT(voiceDict);
    if (!(await isAiFeatureEnabled("voice"))) {
        return { error: (await getT(aiFeaturesDict)).disabledTitle };
    }
    const ai = getGemini();
    if (!ai) return { error: t.notConfigured };

    const audio = formData.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
        return { error: t.noAudio };
    }
    if (audio.size > MAX_AUDIO_BYTES) {
        return { error: t.tooLong };
    }

    const today = String(formData.get("today") ?? "");
    const todayDate = DATE_PATTERN.test(today) ? today : new Date().toISOString().slice(0, 10);

    try {
        const response = await generateWithFallback(await createClient(), ai, {
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
                        { text: `Today is ${todayDate}. Turn this recording into transactions.` },
                    ],
                },
            ],
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
            },
        });

        const parsed = JSON.parse(response.text ?? "{}") as {
            heard?: string;
            transactions?: unknown;
        };
        const raw = Array.isArray(parsed.transactions) ? (parsed.transactions as RawEntry[]) : [];
        const entries = raw
            .slice(0, MAX_ENTRIES)
            .map((entry) => toEntry(entry, todayDate, t.fallbackTitle))
            // An entry with neither a title nor an amount is noise, not something to confirm.
            .filter((entry) => entry.amount > 0 || entry.title !== t.fallbackTitle);

        if (entries.length === 0) return { error: t.notUnderstood };

        return { heard: parsed.heard?.trim() ?? "", entries };
    } catch (error) {
        console.error("[parseVoiceTransaction]", error);
        const status = errorStatus(error);
        if (status === 503) return { error: t.aiBusy };
        if (status === 429) return { error: t.aiQuota };
        const message = error instanceof Error ? error.message : String(error);
        return { error: t.aiFailed(message.slice(0, 200)) };
    }
}

"use server";

import { Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { getTransactions } from "@/lib/transactions";
import { buildSpendingSummary, type SpendingSummary } from "@/lib/spending-summary";
import { ADVISOR_MODELS, errorStatus, generateWithFallback, getGemini } from "@/lib/gemini";
import { getLocale, getT } from "@/lib/i18n/server";
import { isAiFeatureEnabled } from "@/lib/ai-features-server";
import { aiFeaturesDict } from "@/lib/i18n/dictionaries/ai-features";
import type { Locale } from "@/lib/i18n/config";
import { advisorDict } from "@/lib/i18n/dictionaries/advisor";

export interface AdviceInsight {
    title: string;
    detail: string;
    tone: "good" | "warn" | "info";
}

export type AdviceResult =
    | { headline: string; insights: AdviceInsight[] }
    | { error: string };

export type QuestionsResult =
    | { questions: string[]; source: "search" | "model" }
    | { error: string };

export interface ChatMessage {
    role: "user" | "model";
    text: string;
}

export type ChatResult = { reply: string } | { error: string };

const ADVICE_TTL_MS = 6 * 60 * 60 * 1000;
const QUESTIONS_TTL_MS = 24 * 60 * 60 * 1000;

const adviceCache = new Map<string, { at: number; value: AdviceResult }>();
const questionsCache = new Map<Locale, { at: number; value: QuestionsResult }>();

const LANGUAGE_NAME: Record<Locale, string> = { mn: "Mongolian", en: "English" };

const advisorPersona = (locale: Locale) => `You are a personal finance advisor for a user in Mongolia.
Always answer in ${LANGUAGE_NAME[locale]}, friendly and concise, whatever language the data is in.
Write money in tugrik with the ₮ sign and thousands separators (e.g. 15,260₮).
Rely only on the numbers given; never invent figures.
No Markdown, asterisks (*) or heading marks — plain text only.`;

function friendlyError(error: unknown, t: (typeof advisorDict)[Locale]) {
    const status = errorStatus(error);
    if (status === 503) return t.aiBusy;
    if (status === 429) return t.aiQuota;
    return t.aiFailed;
}

async function loadSummary(): Promise<{ userId: string; summary: SpendingSummary } | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const transactions = await getTransactions(500);
    return { userId: user.id, summary: buildSpendingSummary(transactions) };
}

export async function getAdvice(): Promise<AdviceResult> {
    const locale = await getLocale();
    const t = advisorDict[locale];
    if (!(await isAiFeatureEnabled("advisor"))) {
        return { error: (await getT(aiFeaturesDict)).disabledTitle };
    }
    const ai = getGemini();
    if (!ai) return { error: t.notConfigured };

    const loaded = await loadSummary();
    if (!loaded) return { error: t.signedOut };
    const { userId, summary } = loaded;

    if (summary.txCount === 0 && summary.monthIncome === 0) {
        return {
            headline: t.emptyHeadline,
            insights: [{ title: t.emptyTitle, detail: t.emptyDetail, tone: "info" }],
        };
    }

    const cacheKey = `${locale}:${userId}:${JSON.stringify(summary)}`;
    const cached = adviceCache.get(cacheKey);
    if (cached && Date.now() - cached.at < ADVICE_TTL_MS) return cached.value;

    try {
        const response = await generateWithFallback(ai, {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `My spending summary for the last 30 days (JSON):\n${JSON.stringify(summary)}\n\nAnalyze it and give one main takeaway (headline) and 3-5 insights. Mention which category and which place take the most money, and compare with last month. tone: "good" for a healthy habit, "warn" for something to watch, "info" for general information. Write headline, title and detail in ${LANGUAGE_NAME[locale]}.`,
                        },
                    ],
                },
            ],
            config: {
                systemInstruction: advisorPersona(locale),
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        headline: { type: Type.STRING },
                        insights: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    detail: { type: Type.STRING },
                                    tone: { type: Type.STRING, enum: ["good", "warn", "info"] },
                                },
                                required: ["title", "detail", "tone"],
                            },
                        },
                    },
                    required: ["headline", "insights"],
                },
            },
        }, ADVISOR_MODELS);

        const parsed = JSON.parse(response.text ?? "{}") as {
            headline?: string;
            insights?: AdviceInsight[];
        };
        const value: AdviceResult = {
            headline: parsed.headline?.trim() || t.defaultHeadline,
            insights: (parsed.insights ?? [])
                .filter((i) => i?.title && i?.detail)
                .slice(0, 5)
                .map((i) => ({
                    title: i.title.trim(),
                    detail: i.detail.trim(),
                    tone: ["good", "warn", "info"].includes(i.tone) ? i.tone : "info",
                })),
        };
        adviceCache.set(cacheKey, { at: Date.now(), value });
        return value;
    } catch (error) {
        console.error("[getAdvice]", error);
        return { error: friendlyError(error, t) };
    }
}

const questionsPrompt = (locale: Locale) => `List the 8 personal finance questions people search for most online.
Pick ones relevant to life in Mongolia (salary, savings, loans, deposit interest, budgeting, investing).
Write each question in ${LANGUAGE_NAME[locale]}, under 60 characters, ending with a question mark.
Return only a JSON array: ["question 1", "question 2", ...]`;

function parseQuestions(text: string | undefined): string[] {
    const match = text?.match(/\[[\s\S]*\]/);
    if (!match) return [];
    try {
        const list = JSON.parse(match[0]) as unknown[];
        return list
            .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
            .map((q) => q.trim())
            .slice(0, 8);
    } catch {
        return [];
    }
}

export async function getPopularQuestions(): Promise<QuestionsResult> {
    const locale = await getLocale();
    const t = advisorDict[locale];
    if (!(await isAiFeatureEnabled("advisor"))) {
        return { error: (await getT(aiFeaturesDict)).disabledTitle };
    }
    const ai = getGemini();
    if (!ai) return { error: t.notConfigured };

    const cached = questionsCache.get(locale);
    if (cached && Date.now() - cached.at < QUESTIONS_TTL_MS) return cached.value;
    const prompt = questionsPrompt(locale);

    // Search grounding has no quota on free keys, so fall back to the model's own knowledge.
    let value: QuestionsResult | null = null;
    try {
        const grounded = await ai.models.generateContent({
            model: ADVISOR_MODELS[0],
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        const questions = parseQuestions(grounded.text);
        if (questions.length) value = { questions, source: "search" };
    } catch (error) {
        console.warn("[getPopularQuestions] search grounding unavailable", errorStatus(error));
    }

    if (!value) {
        try {
            const response = await generateWithFallback(ai, {
                contents: prompt,
                config: { responseMimeType: "application/json" },
            }, ADVISOR_MODELS);
            const questions = parseQuestions(response.text);
            if (!questions.length) return { error: t.questionsFailed };
            value = { questions, source: "model" };
        } catch (error) {
            console.error("[getPopularQuestions]", error);
            return { error: friendlyError(error, t) };
        }
    }

    questionsCache.set(locale, { at: Date.now(), value });
    return value;
}

const MAX_HISTORY = 12;
const MAX_MESSAGE_CHARS = 1000;

export async function askAdvisor(history: ChatMessage[]): Promise<ChatResult> {
    const locale = await getLocale();
    const t = advisorDict[locale];
    if (!(await isAiFeatureEnabled("advisor"))) {
        return { error: (await getT(aiFeaturesDict)).disabledTitle };
    }
    const ai = getGemini();
    if (!ai) return { error: t.notConfigured };

    const messages = (Array.isArray(history) ? history : [])
        .filter(
            (m) =>
                (m?.role === "user" || m?.role === "model") &&
                typeof m.text === "string" &&
                m.text.trim()
        )
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, text: m.text.trim().slice(0, MAX_MESSAGE_CHARS) }));

    if (!messages.length || messages[messages.length - 1].role !== "user") {
        return { error: t.askFirst };
    }

    const loaded = await loadSummary();
    if (!loaded) return { error: t.signedOut };

    try {
        const response = await generateWithFallback(ai, {
            contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
            config: {
                systemInstruction: `${advisorPersona(locale)}\nThe user's spending summary for the last 30 days (JSON): ${JSON.stringify(loaded.summary)}\nUse it when the question is about the user's own finances. Keep the answer under 120 words.`,
            },
        }, ADVISOR_MODELS);
        const reply = response.text?.trim();
        if (!reply) return { error: t.emptyAnswer };
        return { reply };
    } catch (error) {
        console.error("[askAdvisor]", error);
        return { error: friendlyError(error, t) };
    }
}

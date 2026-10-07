import "server-only";

import { GoogleGenAI } from "@google/genai";
import { recordAiUsage } from "@/lib/ai-usage";

const DEFAULT_MODELS = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.5-flash-lite"];

// Lite has its own daily quota, so advisor calls never starve receipt scans.
export const ADVISOR_MODELS = ["gemini-3.5-flash-lite", "gemini-flash-latest"];

export const errorStatus = (error: unknown) =>
    typeof error === "object" && error && "status" in error
        ? Number((error as { status: unknown }).status)
        : undefined;

export function getGemini(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    return apiKey ? new GoogleGenAI({ apiKey }) : null;
}

// Free-tier Gemini returns transient 503/429 under load, so retry then fall back.
export async function generateWithFallback(
    ai: GoogleGenAI,
    request: Omit<Parameters<GoogleGenAI["models"]["generateContent"]>[0], "model">,
    models: string[] = DEFAULT_MODELS
) {
    let lastError: unknown;
    for (const model of models) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await ai.models.generateContent({ ...request, model });
                await recordAiUsage(response.modelVersion ?? model, response.usageMetadata);
                return response;
            } catch (error) {
                lastError = error;
                const status = errorStatus(error);
                if (status !== 503 && status !== 429) throw error;
                await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
            }
        }
    }
    throw lastError;
}

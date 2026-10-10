import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// Paid-tier USD per 1M tokens; thinking tokens bill as output.
const PRICING: Record<string, { input: number; output: number }> = {
    "gemini-3.5-flash-lite": { input: 0.3, output: 2.5 },
    "gemini-3.5-flash": { input: 1.5, output: 9 },
};
const DEFAULT_PRICING = PRICING["gemini-3.5-flash"];

export const USD_TO_MNT = 3600;

export interface UsageTokens {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
}

export function costUsd(model: string, usage: UsageTokens) {
    // Longest prefix first, so "flash-lite" is not priced as "flash".
    const price =
        Object.entries(PRICING)
            .sort(([a], [b]) => b.length - a.length)
            .find(([name]) => model.startsWith(name))?.[1] ?? DEFAULT_PRICING;
    const input = usage.promptTokenCount ?? 0;
    const output = (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0);
    return (input * price.input + output * price.output) / 1_000_000;
}

// Best-effort: a failed write must never fail the AI call itself.
export async function recordAiUsage(supabase: SupabaseClient, model: string, usage: UsageTokens | undefined) {
    if (!usage) return;
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("ex_ai_usage").insert({
            user_id: user.id,
            model,
            input_tokens: usage.promptTokenCount ?? 0,
            output_tokens: usage.candidatesTokenCount ?? 0,
            thinking_tokens: usage.thoughtsTokenCount ?? 0,
            cost_usd: costUsd(model, usage),
        });
        if (error) console.error("[recordAiUsage]", error.message);
    } catch (error) {
        console.error("[recordAiUsage]", error);
    }
}

export interface AiUsageRow {
    id: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    costMnt: number;
    createdAt: string;
}

export interface AiUsageStats {
    /** False until the ex_ai_usage table exists. */
    available: boolean;
    scans: number;
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    costMnt: number;
    monthScans: number;
    monthCostMnt: number;
    recent: AiUsageRow[];
}

export async function getAiUsageStats(supabase: SupabaseClient): Promise<AiUsageStats> {
    const { data, error } = await supabase
        .from("ex_ai_usage")
        .select("id, model, input_tokens, output_tokens, thinking_tokens, cost_usd, created_at")
        .order("created_at", { ascending: false });

    const stats: AiUsageStats = {
        available: !error,
        scans: 0,
        inputTokens: 0,
        outputTokens: 0,
        thinkingTokens: 0,
        costMnt: 0,
        monthScans: 0,
        monthCostMnt: 0,
        recent: [],
    };
    if (error || !data) return stats;

    const now = new Date();
    for (const row of data) {
        const costMnt = Number(row.cost_usd) * USD_TO_MNT;
        stats.scans += 1;
        stats.inputTokens += row.input_tokens;
        stats.outputTokens += row.output_tokens;
        stats.thinkingTokens += row.thinking_tokens;
        stats.costMnt += costMnt;

        const created = new Date(row.created_at);
        if (
            created.getFullYear() === now.getFullYear() &&
            created.getMonth() === now.getMonth()
        ) {
            stats.monthScans += 1;
            stats.monthCostMnt += costMnt;
        }

        if (stats.recent.length < 10) {
            stats.recent.push({
                id: row.id,
                model: row.model,
                inputTokens: row.input_tokens,
                outputTokens: row.output_tokens,
                thinkingTokens: row.thinking_tokens,
                costMnt,
                createdAt: row.created_at,
            });
        }
    }
    return stats;
}

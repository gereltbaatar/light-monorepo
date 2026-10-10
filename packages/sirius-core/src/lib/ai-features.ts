export const AI_FEATURES = ["advisor", "voice", "receipt"] as const;
export type AiFeature = (typeof AI_FEATURES)[number];
export type AiFeatures = Record<AiFeature, boolean>;

export const DEFAULT_AI_FEATURES: AiFeatures = { advisor: true, voice: true, receipt: true };

export const isAiFeature = (value: unknown): value is AiFeature =>
    typeof value === "string" && (AI_FEATURES as readonly string[]).includes(value);

// Only an explicit false switches a feature off, so new features default to on.
export function parseAiFeatures(raw: unknown): AiFeatures {
    const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    return {
        advisor: data.advisor !== false,
        voice: data.voice !== false,
        receipt: data.receipt !== false,
    };
}

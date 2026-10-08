export const AI_FEATURES = ["advisor", "voice", "receipt"] as const;
export type AiFeature = (typeof AI_FEATURES)[number];
export type AiFeatures = Record<AiFeature, boolean>;

export const AI_FEATURES_COOKIE = "ai-features";

export const DEFAULT_AI_FEATURES: AiFeatures = { advisor: true, voice: true, receipt: true };

export const isAiFeature = (value: unknown): value is AiFeature =>
    typeof value === "string" && (AI_FEATURES as readonly string[]).includes(value);

// Cookie holds only the switched-off features, so new features default to on.
export function parseAiFeatures(raw: string | undefined): AiFeatures {
    const off = new Set((raw ?? "").split(",").filter(isAiFeature));
    return {
        advisor: !off.has("advisor"),
        voice: !off.has("voice"),
        receipt: !off.has("receipt"),
    };
}

export const serializeAiFeatures = (features: AiFeatures) =>
    AI_FEATURES.filter((f) => !features[f]).join(",");

import { DEFAULT_AI_FEATURES, parseAiFeatures, type AiFeatures } from "./ai-features";
import { DEFAULT_VOICE_ORB, parseVoiceOrbSettings, type VoiceOrbSettings } from "./voice-orb";

export interface AiSettings {
    features: AiFeatures;
    orb: VoiceOrbSettings;
}

export const DEFAULT_AI_SETTINGS: AiSettings = { features: DEFAULT_AI_FEATURES, orb: DEFAULT_VOICE_ORB };

export function parseAiSettings(raw: unknown): AiSettings {
    const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    return { features: parseAiFeatures(data.features), orb: parseVoiceOrbSettings(data.orb) };
}

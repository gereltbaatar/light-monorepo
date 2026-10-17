import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiFeature, AiFeatures } from "./ai-features";
import { parseAiSettings, type AiSettings } from "./ai-settings-shared";
import { parseVoiceOrbSettings, type VoiceOrbSettings } from "./voice-orb";

export { DEFAULT_AI_SETTINGS, type AiSettings } from "./ai-settings-shared";

// Stored on the shared profile so every Sirius app reads the same settings.
// Pass userId when the caller already knows it, to skip an Auth round trip.
export async function getAiSettings(supabase: SupabaseClient, userId?: string | null): Promise<AiSettings> {
    let id = userId;
    if (id === undefined) {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        id = user?.id ?? null;
    }
    if (!id) return parseAiSettings(null);

    const { data } = await supabase.from("profiles").select("ai_settings").eq("id", id).maybeSingle();
    return parseAiSettings(data?.ai_settings);
}

export async function isAiFeatureEnabled(supabase: SupabaseClient, feature: AiFeature): Promise<boolean> {
    return (await getAiSettings(supabase)).features[feature];
}

async function saveAiSettings(
    supabase: SupabaseClient,
    patch: (current: AiSettings) => AiSettings
): Promise<{ error: string } | { ok: true; settings: AiSettings }> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not signed in" };

    const settings = patch(await getAiSettings(supabase));
    const { error } = await supabase.from("profiles").update({ ai_settings: settings }).eq("id", user.id);
    return error ? { error: error.message } : { ok: true, settings };
}

export const saveAiFeature = (supabase: SupabaseClient, feature: AiFeature, enabled: boolean) =>
    saveAiSettings(supabase, (current) => ({
        ...current,
        features: { ...current.features, [feature]: enabled } as AiFeatures,
    }));

// Re-parsed so the row only ever holds validated, clamped values.
export const saveVoiceOrb = (supabase: SupabaseClient, input: VoiceOrbSettings) =>
    saveAiSettings(supabase, (current) => ({ ...current, orb: parseVoiceOrbSettings(input) }));

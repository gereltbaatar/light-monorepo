"use server";

import { revalidatePath } from "next/cache";
import { saveVoiceOrb } from "@workspace/sirius-core/lib/ai-settings";
import type { VoiceOrbSettings } from "@workspace/sirius-core/lib/voice-orb";
import { createClient } from "@/lib/supabase/server";

export async function setVoiceOrbSettings(
    input: VoiceOrbSettings
): Promise<{ error: string } | { ok: true; settings: VoiceOrbSettings }> {
    if (!input || typeof input !== "object") return { error: "Invalid settings" };

    const result = await saveVoiceOrb(await createClient(), input);
    if ("error" in result) return result;
    revalidatePath("/", "layout");
    return { ok: true, settings: result.settings.orb };
}

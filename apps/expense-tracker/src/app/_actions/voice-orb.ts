"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
    VOICE_ORB_COOKIE,
    parseVoiceOrbSettings,
    serializeVoiceOrbSettings,
    type VoiceOrbSettings,
} from "@/lib/voice-orb";

export async function setVoiceOrbSettings(
    input: VoiceOrbSettings
): Promise<{ error: string } | { ok: true; settings: VoiceOrbSettings }> {
    if (!input || typeof input !== "object") return { error: "Invalid settings" };

    // Re-parse so the cookie only ever holds validated, clamped values.
    const settings = parseVoiceOrbSettings(JSON.stringify(input));
    (await cookies()).set(VOICE_ORB_COOKIE, serializeVoiceOrbSettings(settings), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
    });
    revalidatePath("/", "layout");
    return { ok: true, settings };
}

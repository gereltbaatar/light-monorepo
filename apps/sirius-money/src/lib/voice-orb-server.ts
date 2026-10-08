import "server-only";

import { cookies } from "next/headers";
import { VOICE_ORB_COOKIE, parseVoiceOrbSettings, type VoiceOrbSettings } from "./voice-orb";

export async function getVoiceOrbSettings(): Promise<VoiceOrbSettings> {
    return parseVoiceOrbSettings((await cookies()).get(VOICE_ORB_COOKIE)?.value);
}

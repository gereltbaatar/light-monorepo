"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@workspace/sirius-core/supabase/server";
import { isAiFeature } from "@workspace/sirius-core/lib/ai-features";
import { saveAiFeature, saveVoiceOrb } from "@workspace/sirius-core/lib/ai-settings";
import { USD_TO_MNT, getAiUsageStats, type AiUsageStats } from "@workspace/sirius-core/lib/ai-usage";
import type { VoiceOrbSettings } from "@workspace/sirius-core/lib/voice-orb";

export async function setAiFeature(feature: string, enabled: boolean): Promise<{ error: string } | { ok: true }> {
  if (!isAiFeature(feature) || typeof enabled !== "boolean") return { error: "Unknown setting" };

  const result = await saveAiFeature(await createClient(), feature, enabled);
  if ("error" in result) return result;
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setVoiceOrbSettings(input: VoiceOrbSettings): Promise<{ error: string } | { ok: true }> {
  if (!input || typeof input !== "object") return { error: "Invalid settings" };

  const result = await saveVoiceOrb(await createClient(), input);
  if ("error" in result) return result;
  revalidatePath("/", "layout");
  return { ok: true };
}

export type AiUsage = AiUsageStats & { usdToMnt: number };

export async function getAiUsage(): Promise<AiUsage> {
  return { ...(await getAiUsageStats(await createClient())), usdToMnt: USD_TO_MNT };
}

"use server";

import { revalidatePath } from "next/cache";
import { isAiFeature } from "@workspace/sirius-core/lib/ai-features";
import { saveAiFeature } from "@workspace/sirius-core/lib/ai-settings";
import { createClient } from "@/lib/supabase/server";

export async function setAiFeature(
    feature: string,
    enabled: boolean
): Promise<{ error: string } | { ok: true }> {
    if (!isAiFeature(feature) || typeof enabled !== "boolean") {
        return { error: "Unknown setting" };
    }

    const result = await saveAiFeature(await createClient(), feature, enabled);
    if ("error" in result) return result;
    revalidatePath("/", "layout");
    return { ok: true };
}

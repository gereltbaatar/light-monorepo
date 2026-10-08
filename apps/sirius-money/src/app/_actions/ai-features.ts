"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AI_FEATURES_COOKIE, isAiFeature, serializeAiFeatures } from "@/lib/ai-features";
import { getAiFeatures } from "@/lib/ai-features-server";

export async function setAiFeature(
    feature: string,
    enabled: boolean
): Promise<{ error: string } | { ok: true }> {
    if (!isAiFeature(feature) || typeof enabled !== "boolean") {
        return { error: "Unknown setting" };
    }

    const next = { ...(await getAiFeatures()), [feature]: enabled };
    (await cookies()).set(AI_FEATURES_COOKIE, serializeAiFeatures(next), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
    });
    revalidatePath("/", "layout");
    return { ok: true };
}

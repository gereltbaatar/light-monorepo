import "server-only";

import { cookies } from "next/headers";
import { AI_FEATURES_COOKIE, parseAiFeatures, type AiFeature, type AiFeatures } from "./ai-features";

export async function getAiFeatures(): Promise<AiFeatures> {
    return parseAiFeatures((await cookies()).get(AI_FEATURES_COOKIE)?.value);
}

export async function isAiFeatureEnabled(feature: AiFeature): Promise<boolean> {
    return (await getAiFeatures())[feature];
}

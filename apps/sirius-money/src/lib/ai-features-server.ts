import "server-only";

import * as shared from "@workspace/sirius-core/lib/ai-settings";
import type { AiFeature } from "@workspace/sirius-core/lib/ai-features";
import { createClient } from "@/lib/supabase/server";

export const getAiSettings = async () => shared.getAiSettings(await createClient());

export const isAiFeatureEnabled = async (feature: AiFeature) =>
    shared.isAiFeatureEnabled(await createClient(), feature);

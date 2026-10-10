"use client";

import { toast } from "sonner";
import { OrbSettings as SharedOrbSettings } from "@workspace/sirius-core/components/OrbSettings";
import { setVoiceOrbSettings } from "@/app/_actions/voice-orb";
import { useT } from "@/lib/i18n/client";
import { orbDict } from "@/lib/i18n/dictionaries/orb";

export const OrbSettings = () => {
    const t = useT(orbDict);
    return <SharedOrbSettings labels={t} onSave={setVoiceOrbSettings} onError={toast.error} />;
};

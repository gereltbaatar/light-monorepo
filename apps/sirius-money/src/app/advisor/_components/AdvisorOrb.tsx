"use client";

import { VoiceOrb, type OrbState } from "@workspace/sirius-core/components/VoiceOrb";
import { useT } from "@/lib/i18n/client";
import { orbDict } from "@/lib/i18n/dictionaries/orb";
import { useChatStatus } from "./AdvisorChat";

export const AdvisorOrb = ({ state }: { state?: OrbState }) => {
    const chat = useChatStatus();
    const t = useT(orbDict);
    const resolved: OrbState = state ?? (chat?.isThinking ? "thinking" : "idle");

    return <VoiceOrb state={resolved} className="mx-auto" settings={{ size: 144 }} label={t.label} />;
};

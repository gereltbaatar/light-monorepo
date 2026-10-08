"use client";

import { VoiceOrb, type OrbState } from "@/components/voice-orbs/VoiceOrb";
import { useChatStatus } from "./AdvisorChat";

export const AdvisorOrb = ({ state }: { state?: OrbState }) => {
    const chat = useChatStatus();
    const resolved: OrbState = state ?? (chat?.isThinking ? "thinking" : "idle");

    return <VoiceOrb state={resolved} className="mx-auto" settings={{ size: 144 }} />;
};

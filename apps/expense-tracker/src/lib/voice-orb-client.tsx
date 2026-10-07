"use client";

import { createContext, useContext } from "react";
import { DEFAULT_VOICE_ORB, type VoiceOrbSettings } from "./voice-orb";

const VoiceOrbContext = createContext<VoiceOrbSettings>(DEFAULT_VOICE_ORB);

export const VoiceOrbProvider = ({
    settings,
    children,
}: {
    settings: VoiceOrbSettings;
    children: React.ReactNode;
}) => <VoiceOrbContext.Provider value={settings}>{children}</VoiceOrbContext.Provider>;

export const useVoiceOrbSettings = () => useContext(VoiceOrbContext);

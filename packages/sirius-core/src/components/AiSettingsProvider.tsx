"use client";

import { createContext, useContext } from "react";
import { DEFAULT_AI_SETTINGS, type AiSettings } from "../lib/ai-settings-shared";

const AiSettingsContext = createContext<AiSettings>(DEFAULT_AI_SETTINGS);

export const AiSettingsProvider = ({
    settings,
    children,
}: {
    settings: AiSettings;
    children: React.ReactNode;
}) => <AiSettingsContext.Provider value={settings}>{children}</AiSettingsContext.Provider>;

export const useAiFeatures = () => useContext(AiSettingsContext).features;

export const useVoiceOrbSettings = () => useContext(AiSettingsContext).orb;

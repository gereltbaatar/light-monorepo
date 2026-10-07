"use client";

import { createContext, useContext } from "react";
import { DEFAULT_AI_FEATURES, type AiFeatures } from "./ai-features";

const AiFeaturesContext = createContext<AiFeatures>(DEFAULT_AI_FEATURES);

export const AiFeaturesProvider = ({
    features,
    children,
}: {
    features: AiFeatures;
    children: React.ReactNode;
}) => <AiFeaturesContext.Provider value={features}>{children}</AiFeaturesContext.Provider>;

export const useAiFeatures = () => useContext(AiFeaturesContext);

import { defineDictionary } from "../config";
import type { AiFeature } from "@/lib/ai-features";

interface FeatureText {
    title: string;
}

export const aiFeaturesDict = defineDictionary<{
    section: string;
    failed: string;
    disabledTitle: string;
    disabledBody: string;
    openSettings: string;
    features: Record<AiFeature, FeatureText>;
}>({
    en: {
        section: "AI features",
        failed: "Could not save the setting",
        disabledTitle: "This AI feature is turned off",
        disabledBody: "Turn it back on in Profile → General settings → AI features.",
        openSettings: "Open settings",
        features: {
            advisor: { title: "AI Advisor" },
            voice: { title: "Voice entry" },
            receipt: { title: "Receipt scan" },
        },
    },
    mn: {
        section: "AI тохиргоо",
        failed: "Тохиргоог хадгалж чадсангүй",
        disabledTitle: "Энэ AI функц унтраалттай байна",
        disabledBody: "Профайл → Ерөнхий тохиргоо → AI тохиргоо хэсгээс дахин асаана уу.",
        openSettings: "Тохиргоо нээх",
        features: {
            advisor: { title: "AI зөвлөх" },
            voice: { title: "Audio бүртгэл" },
            receipt: { title: "Зураг бүртгэл" },
        },
    },
});

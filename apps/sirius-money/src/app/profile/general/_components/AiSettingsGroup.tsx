import { Fragment } from "react";
import { SettingsItem } from "@/app/profile/_components/SettingsItem";
import { getT } from "@/lib/i18n/server";
import { profileDict } from "@/lib/i18n/dictionaries/profile";
import { aiFeaturesDict } from "@/lib/i18n/dictionaries/ai-features";

export const AiSettingsGroup = async () => {
    const t = (await getT(profileDict)).settings;
    const ai = await getT(aiFeaturesDict);

    const items = [
        { title: ai.section, icon: "/ai.svg", path: "/profile/ai" },
        { title: t.voiceOrb, icon: "/orb.svg", path: "/profile/orb" },
        { title: t.aiUsage, icon: "/ai-usage.svg", path: "/profile/ai-usage" },
    ];

    return (
        <section className="w-full px-4 pt-8">
            <h2 className="px-1 pb-2 text-sm font-semibold text-muted-foreground">{t.aiGroup}</h2>
            <div className="w-full overflow-hidden rounded-3xl bg-surface">
                {items.map((item, index) => (
                    <Fragment key={item.path}>
                        <SettingsItem setting={item} />
                        {index < items.length - 1 && <div className="mx-4 h-px bg-border" />}
                    </Fragment>
                ))}
            </div>
        </section>
    );
};

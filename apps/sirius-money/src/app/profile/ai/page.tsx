import { SettingsPageHeader, AiFeatureToggles } from "@/app/profile/_components";
import { BottomNav } from "@/components/navigation/BottomNav";
import { getT } from "@/lib/i18n/server";
import { aiFeaturesDict } from "@/lib/i18n/dictionaries/ai-features";

export default async function AiSettingsPage() {
    const t = await getT(aiFeaturesDict);

    return (
        <div className="w-full max-w-[430px] mx-auto pb-24">
            <SettingsPageHeader title={t.section} />

            <div className="px-4 pt-4">
                <AiFeatureToggles />
            </div>

            <BottomNav />
        </div>
    );
}

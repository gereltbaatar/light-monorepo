import { SettingsPageHeader } from "@/app/profile/_components";
import { BottomNav } from "@/components/navigation/BottomNav";
import { getT } from "@/lib/i18n/server";
import { orbDict } from "@/lib/i18n/dictionaries/orb";
import { OrbSettings } from "./_components/OrbSettings";

export default async function OrbSettingsPage() {
    const t = await getT(orbDict);

    return (
        <div className="w-full max-w-[430px] mx-auto pb-28">
            <SettingsPageHeader title={t.title} />

            <div className="px-4 pt-4">
                <OrbSettings />
            </div>

            <BottomNav />
        </div>
    );
}

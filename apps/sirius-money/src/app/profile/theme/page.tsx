import { SettingsPageHeader } from "@/app/profile/_components";
import { BottomNav } from "@/components/navigation/BottomNav";
import { getT } from "@/lib/i18n/server";
import { profileDict } from "@/lib/i18n/dictionaries/profile";
import { ThemePicker } from "./_components/ThemePicker";

export default async function ThemeSettingsPage() {
    const t = await getT(profileDict);

    return (
        <div className="w-full max-w-[430px] mx-auto pb-24">
            <SettingsPageHeader title={t.settings.appearance} />

            <div className="px-4 pt-4">
                <ThemePicker />
            </div>

            <BottomNav />
        </div>
    );
}

import { SettingsPageHeader } from "@/app/profile/_components";
import { BottomNav } from "@/components/navigation/BottomNav";
import { getT } from "@/lib/i18n/server";
import { languageDict } from "@/lib/i18n/dictionaries/language";
import { LanguagePicker } from "./_components/LanguagePicker";

export default async function LanguageSettingsPage() {
    const t = await getT(languageDict);

    return (
        <div className="w-full max-w-[430px] mx-auto pb-24">
            <SettingsPageHeader title={t.title} />

            <div className="px-4 pt-4">
                <LanguagePicker />
            </div>

            <BottomNav />
        </div>
    );
}

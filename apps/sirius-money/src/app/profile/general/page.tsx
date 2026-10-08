import { SettingsPageHeader } from "@/app/profile/_components";
import { BottomNav } from "@/components/navigation/BottomNav";
import { getCurrentProfile, getDisplayName } from "@/lib/profile";
import { getT } from "@/lib/i18n/server";
import { profileDict } from "@/lib/i18n/dictionaries/profile";
import { GeneralSettingsForm } from "./_components/GeneralSettingsForm";
import { AiSettingsGroup } from "./_components/AiSettingsGroup";

export default async function GeneralSettingsPage() {
    const profile = await getCurrentProfile();
    const t = await getT(profileDict);
    const initialName = getDisplayName(profile);
    const email = profile?.email ?? "";
    const avatar = profile?.avatar_url || "/profile_image.jpg";

    return (
        <div className="w-full max-w-[430px] mx-auto pb-24">
            <SettingsPageHeader title={t.settings.general} />

            <GeneralSettingsForm
                initialDisplayName={initialName}
                email={email}
                avatarUrl={avatar}
            />

            <AiSettingsGroup />

            <BottomNav />
        </div>
    );
}

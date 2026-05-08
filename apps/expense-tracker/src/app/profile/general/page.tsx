import { SettingsPageHeader } from "@/app/profile/_components";
import { BottomNav } from "@/components/navigation/BottomNav";
import { getCurrentProfile, getDisplayName } from "@/lib/profile";
import { GeneralSettingsForm } from "./_components/GeneralSettingsForm";

export default async function GeneralSettingsPage() {
    const profile = await getCurrentProfile();
    const initialName = getDisplayName(profile);
    const email = profile?.email ?? "";
    const avatar = profile?.avatar_url || "/profile_image.jpg";

    return (
        <div className="w-full max-w-[430px] mx-auto pb-24">
            <SettingsPageHeader title="General settings" />

            <GeneralSettingsForm
                initialDisplayName={initialName}
                email={email}
                avatarUrl={avatar}
            />

            <BottomNav />
        </div>
    );
}

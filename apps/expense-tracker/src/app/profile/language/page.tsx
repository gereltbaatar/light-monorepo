import { SettingsPageHeader } from "@/app/profile/_components";
import { BottomNav } from "@/components/navigation/BottomNav";

export default function LanguageSettingsPage() {
    return (
        <div className="w-full max-w-[430px] mx-auto pb-24">
            <SettingsPageHeader title="Language" />

            <div className="px-4 pt-4">
                <div className="w-full bg-[#F8F9FA] rounded-3xl p-6 text-center">
                    <p className="text-base font-medium text-gray-500">
                        Language settings coming soon.
                    </p>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}

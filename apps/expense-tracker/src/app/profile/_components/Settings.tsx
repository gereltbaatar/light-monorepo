import { SettingsItem } from "./SettingsItem";

export const Settings = () => {

    const settings = [
        {
            title: "Pause notifications",
            icon: "/notifications.svg",
            hasToggle: true,
            isToggled: true,
            path: "none",
        },
        {
            title: "General settings",
            icon: "/settings.svg",
            path: "/profile/general",
        },
        {
            title: "Language",
            icon: "/language.svg",
            description: "English",
            rightLabel: "MN, EN",
            path: "/profile/language",
        },
        {
            title: "Dark mode",
            icon: "/theme.svg",
            hasToggle: true,
            isToggled: false,
            path: "none",
        },
    ];

    return (
        <div className="w-full px-4 pt-4">
            <div className="w-full bg-[#F8F9FA] rounded-3xl overflow-hidden">
                {settings.map((setting, index) => (
                    <div key={index}>
                        <SettingsItem setting={setting} />
                        {index < settings.length - 1 && (
                            <div className="w-full h-px bg-gray-200 mx-4" style={{ width: 'calc(100% - 2rem)' }} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
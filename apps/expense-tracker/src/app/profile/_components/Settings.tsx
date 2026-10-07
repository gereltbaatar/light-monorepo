import { SettingsItem } from "./SettingsItem";
import { ThemeLabel } from "@/app/profile/theme/_components/ThemeLabel";
import { LOCALE_NAMES } from "@/lib/i18n/config";
import { getLocale, getT } from "@/lib/i18n/server";
import { profileDict } from "@/lib/i18n/dictionaries/profile";

export const Settings = async () => {
    const locale = await getLocale();
    const t = (await getT(profileDict)).settings;

    const settings = [
        {
            title: t.pauseNotifications,
            icon: "/notifications.svg",
            hasToggle: true,
            isToggled: true,
            path: "none",
        },
        {
            title: t.general,
            icon: "/settings.svg",
            path: "/profile/general",
        },
        {
            title: t.categories,
            icon: "/categories.svg",
            path: "/profile/categories",
        },
        {
            title: t.language,
            icon: "/language.svg",
            description: LOCALE_NAMES[locale],
            rightLabel: LOCALE_NAMES[locale],
            path: "/profile/language",
        },
        {
            title: t.appearance,
            icon: "/theme.svg",
            rightLabel: <ThemeLabel />,
            path: "/profile/theme",
        },
    ];

    return (
        <div className="w-full px-4 pt-4 pb-8">
            <div className="w-full bg-surface rounded-3xl overflow-hidden">
                {settings.map((setting, index) => (
                    <div key={index}>
                        <SettingsItem setting={setting} />
                        {index < settings.length - 1 && (
                            <div className="w-full h-px bg-border mx-4" style={{ width: 'calc(100% - 2rem)' }} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
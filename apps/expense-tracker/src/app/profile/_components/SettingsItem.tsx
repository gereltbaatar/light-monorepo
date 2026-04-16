"use client";

import { ChevronRight, Bell, Globe, Palette, Settings } from "lucide-react";
import { useState } from "react";

interface SettingItemProps {
    setting: {
        title: string;
        icon?: string;
        description?: string;
        label?: string | null;
        path: string;
        hasToggle?: boolean;
        isToggled?: boolean;
        rightLabel?: string; // New: Label to show on the right side (e.g., "MN, EN")
    };
}

export const SettingsItem = ({ setting }: SettingItemProps) => {
    const [isToggled, setIsToggled] = useState(setting.isToggled ?? false);

    const handleToggle = () => {
        setIsToggled(!isToggled);
        // TODO: Add toggle logic here
    };

    const handleClick = () => {
        if (setting.path !== "none") {
            // TODO: Navigate to setting.path
            console.log("Navigate to:", setting.path);
        }
    };

    // Get icon component based on icon name
    const getIcon = () => {
        switch (setting.icon) {
            case "/notifications.svg":
                return <Bell className="w-5 h-5" />;
            case "/language.svg":
                return <Globe className="w-5 h-5" />;
            case "/theme.svg":
                return <Palette className="w-5 h-5" />;
            case "/settings.svg":
                return <Settings className="w-5 h-5" />;
            default:
                return <Settings className="w-5 h-5" />;
        }
    };

    return (
        <div
            onClick={!setting.hasToggle ? handleClick : undefined}
            className={`
                w-full px-4 py-4 flex items-center justify-between h-[60px]
                ${!setting.hasToggle ? 'cursor-pointer hover:bg-gray-100 active:bg-gray-200' : ''}
                transition-colors
            `}
        >
            {/* Left side: Icon + Text */}
            <div className="flex items-center gap-3">
                {setting.icon && (
                    <div className="text-gray-600">
                        {getIcon()}
                    </div>
                )}
                <div className="flex flex-col">
                    <p className="text-base font-medium text-gray-900">{setting.title}</p>
                </div>
            </div>

            {/* Right side: Toggle or Label + Chevron */}
            <div className="flex items-center gap-2">
                {setting.hasToggle ? (
                    // Toggle Switch
                    <button
                        onClick={handleToggle}
                        className={`
                            relative w-12 h-7 rounded-full transition-colors duration-200 ease-in-out
                            ${isToggled ? 'bg-green-500' : 'bg-gray-300'}
                        `}
                    >
                        <div
                            className={`
                                absolute top-1 w-5 h-5 bg-white rounded-full shadow-md
                                transition-transform duration-200 ease-in-out
                                ${isToggled ? 'translate-x-6' : 'translate-x-1'}
                            `}
                        />
                    </button>
                ) : (
                    // Label + Chevron (for navigation)
                    <>
                        {setting.rightLabel && (
                            <p className="text-sm font-medium text-gray-500">{setting.rightLabel}</p>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
                    </>
                )}
            </div>
        </div>
    );
};
"use client";

import { Check } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useT } from "@/lib/i18n/client";
import { profileDict } from "@/lib/i18n/dictionaries/profile";
import { THEME_OPTIONS } from "./themeOptions";
import { useMounted } from "./useMounted";

export const ThemePicker = () => {
    const { theme, setTheme } = useTheme();
    const mounted = useMounted();
    const t = useT(profileDict);

    return (
        <div className="w-full bg-surface rounded-3xl overflow-hidden">
            {THEME_OPTIONS.map(({ value, icon: Icon }, index) => {
                const isSelected = mounted && theme === value;

                return (
                    <div key={value}>
                        <button
                            type="button"
                            onClick={() => setTheme(value)}
                            aria-pressed={isSelected}
                            className="w-full px-4 py-4 flex items-center justify-between h-[60px] cursor-pointer hover:bg-surface-2 active:bg-surface-2 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 text-muted-foreground" />
                                <p className="text-base font-medium text-foreground">{t.theme[value]}</p>
                            </div>
                            {isSelected && (
                                <Check className="w-5 h-5 text-foreground" strokeWidth={2.5} />
                            )}
                        </button>
                        {index < THEME_OPTIONS.length - 1 && (
                            <div className="h-px bg-border mx-4" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

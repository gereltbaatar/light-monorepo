"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useT } from "@/lib/i18n/client";
import { profileDict } from "@/lib/i18n/dictionaries/profile";
import { themeLabel } from "./themeOptions";
import { useMounted } from "./useMounted";

export const ThemeLabel = () => {
    const { theme } = useTheme();
    const mounted = useMounted();
    const t = useT(profileDict);

    if (!mounted) return null;
    return <>{themeLabel(theme, t.theme)}</>;
};

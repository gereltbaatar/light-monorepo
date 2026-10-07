import { Monitor, Moon, Sun } from "lucide-react";

export const THEME_OPTIONS = [
    { value: "system", icon: Monitor },
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
] as const;

export type ThemeValue = (typeof THEME_OPTIONS)[number]["value"];

export const themeLabel = (theme: string | undefined, labels: Record<ThemeValue, string>) =>
    labels[THEME_OPTIONS.find((option) => option.value === theme)?.value ?? "system"];

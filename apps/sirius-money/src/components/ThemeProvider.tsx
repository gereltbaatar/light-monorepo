"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { DARK_QUERY, THEME_STORAGE_KEY } from "@/lib/theme-script";

export type Theme = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const THEMES: Theme[] = ["system", "light", "dark"];

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const mq = window.matchMedia(DARK_QUERY);
    mq.addEventListener("change", listener);
    const onStorage = (e: StorageEvent) => {
        if (e.key === THEME_STORAGE_KEY) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
        listeners.delete(listener);
        mq.removeEventListener("change", listener);
        window.removeEventListener("storage", onStorage);
    };
};

const readTheme = (): Theme => {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        return THEMES.includes(stored as Theme) ? (stored as Theme) : "system";
    } catch {
        return "system";
    }
};

const readSystem = (): ResolvedTheme => (window.matchMedia(DARK_QUERY).matches ? "dark" : "light");

const applyTheme = (resolved: ResolvedTheme, animate: boolean) => {
    const root = document.documentElement;
    // Blocks transitions during the swap so the page doesn't fade.
    const style = animate ? null : document.createElement("style");
    if (style) {
        style.textContent = "*,*::before,*::after{transition:none!important}";
        document.head.appendChild(style);
    }
    root.classList.toggle("dark", resolved === "dark");
    root.classList.toggle("light", resolved === "light");
    root.style.colorScheme = resolved;
    if (style) {
        void window.getComputedStyle(root).opacity;
        style.remove();
    }
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);
    const system = useSyncExternalStore(subscribe, readSystem, () => "light" as ResolvedTheme);
    const resolvedTheme: ResolvedTheme = theme === "system" ? system : theme;

    useEffect(() => {
        applyTheme(resolvedTheme, false);
    }, [resolvedTheme]);

    const setTheme = useCallback((next: Theme) => {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            // Private mode: the choice lasts for this page only.
        }
        notify();
    }, []);

    const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
    const value = useContext(ThemeContext);
    if (!value) throw new Error("useTheme must be used inside ThemeProvider");
    return value;
};

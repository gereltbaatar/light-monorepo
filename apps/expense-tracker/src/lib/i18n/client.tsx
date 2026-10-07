"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Dictionary, type Locale } from "./config";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export const LocaleProvider = ({
    locale,
    children,
}: {
    locale: Locale;
    children: React.ReactNode;
}) => <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;

export const useLocale = () => useContext(LocaleContext);

export function useT<T>(dictionary: Dictionary<T>): T {
    return dictionary[useLocale()];
}

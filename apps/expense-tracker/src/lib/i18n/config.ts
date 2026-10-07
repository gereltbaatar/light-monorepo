export const LOCALES = ["mn", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "mn";
export const LOCALE_COOKIE = "locale";

export const LOCALE_NAMES: Record<Locale, string> = {
    mn: "Монгол",
    en: "English",
};

// BCP 47 tags for Intl date and number formatting.
export const INTL_LOCALE: Record<Locale, string> = {
    mn: "mn-MN",
    en: "en-US",
};

export const isLocale = (value: unknown): value is Locale =>
    typeof value === "string" && (LOCALES as readonly string[]).includes(value);

// Typing `mn` against `en` makes a missing or misspelled key a compile error.
export function defineDictionary<T>(dictionary: { en: T; mn: T }) {
    return dictionary;
}

export type Dictionary<T> = { en: T; mn: T };

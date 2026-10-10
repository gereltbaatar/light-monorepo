export const LOCALES = ["mn", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "mn";
export const LOCALE_COOKIE = "locale";

export const LOCALE_NAMES: Record<Locale, string> = {
  mn: "Монгол",
  en: "English (United States)",
};

export const LOCALE_ENGLISH_NAMES: Record<Locale, string> = {
  mn: "Mongolian",
  en: "English (United States)",
};

export const INTL_LOCALE: Record<Locale, string> = {
  mn: "mn-MN",
  en: "en-US",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

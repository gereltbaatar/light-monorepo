import "server-only";

import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Dictionary, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
    const value = (await cookies()).get(LOCALE_COOKIE)?.value;
    return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getT<T>(dictionary: Dictionary<T>): Promise<T> {
    return dictionary[await getLocale()];
}

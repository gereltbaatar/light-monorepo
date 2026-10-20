import { enUS, mn } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/config";

// Browsers often lack Intl data for mn, so date-fns supplies it.
export const DATE_LOCALE: Record<Locale, typeof enUS> = { mn, en: enUS };

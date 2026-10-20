import { SettingsPageHeader } from "@/app/profile/_components";
import { BottomNav } from "@/components/navigation/BottomNav";
import { getPreferredCurrencies } from "@/lib/currency-settings";
import { getExchangeRates } from "@/lib/exchange-rates";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getLocale, getT } from "@/lib/i18n/server";
import { currenciesDict } from "@/lib/i18n/dictionaries/currencies";
import { CurrencyPicker } from "./_components/CurrencyPicker";

export default async function CurrencySettingsPage() {
    const [t, locale, rates, preferred] = await Promise.all([
        getT(currenciesDict),
        getLocale(),
        getExchangeRates(),
        getPreferredCurrencies(),
    ]);
    // Named on the server, whose ICU data covers Mongolian unlike some browsers.
    const names = new Intl.DisplayNames([INTL_LOCALE[locale]], { type: "currency" });
    const currencies = (rates?.rates ?? []).map((rate) => ({
        ...rate,
        name: names.of(rate.code) ?? rate.code,
    }));

    return (
        <div className="w-full max-w-[430px] mx-auto pb-24">
            <SettingsPageHeader title={t.title} />

            <div className="px-4 pt-4">
                {rates ? (
                    <CurrencyPicker
                        currencies={currencies}
                        initialSelected={preferred}
                        rateDate={rates.date}
                        baseName={names.of("MNT") ?? "MNT"}
                    />
                ) : (
                    <p className="rounded-3xl bg-surface px-4 py-4 text-sm text-muted-foreground">
                        {t.unavailable}
                    </p>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

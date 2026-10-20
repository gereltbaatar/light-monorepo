import "server-only";

export interface CurrencyRate {
    code: string;
    /** Tugriks per one unit of the currency. */
    rate: number;
}

export interface ExchangeRates {
    /** The day Mongolbank published the rates, YYYY-MM-DD. */
    date: string;
    rates: CurrencyRate[];
}

interface RatesResponse {
    success?: boolean;
    result?: Record<string, string>;
}

// Null on any failure so forms fall back to tugrik-only input.
export async function getExchangeRates(): Promise<ExchangeRates | null> {
    try {
        const response = await fetch("https://www.mongolbank.mn/api/v1/currencyrate", {
            // Mongolbank publishes once a day and throttles bursts.
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(4000),
        });
        if (!response.ok) return null;

        const body = (await response.json()) as RatesResponse;
        const { RATE_DATE: date, ...raw } = body.result ?? {};
        if (!body.success || !date) return null;

        const rates = Object.entries(raw).flatMap(([code, value]) => {
            // Rates arrive comma-grouped, e.g. "3,596.40".
            const rate = Number(value.replace(/,/g, ""));
            return /^[A-Z]{3}$/.test(code) && Number.isFinite(rate) && rate > 0
                ? [{ code, rate }]
                : [];
        });
        return rates.length > 0 ? { date, rates } : null;
    } catch {
        return null;
    }
}

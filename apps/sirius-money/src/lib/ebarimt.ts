/**
 * Free, unauthenticated taxpayer lookup published by the Mongolian tax
 * authority. Confirmed live against api.ebarimt.mn.
 *
 * Scope note: this is the *only* freely reachable part of the ebarimt API.
 * There is no public endpoint that turns a receipt's QR or ДДТД into its
 * contents — those live on the merchant's local PosAPI, behind OAuth2, or
 * behind a host that does not resolve in public DNS. So this cannot replace
 * reading the receipt; it only corroborates the merchant.
 */

export interface TaxpayerInfo {
    /** Registered legal name — often differs from the shop's trading name. */
    name: string;
    vatPayer: boolean;
    isGovernment: boolean;
}

interface GetInfoResponse {
    status?: number;
    data?: {
        name?: string;
        found?: boolean;
        vatPayer?: boolean;
        isGovernment?: boolean;
    };
}

/** Mongolian TINs (ТТД) are numeric; anything else is a misread. */
const isPlausibleTin = (tin: string) => /^\d{7,14}$/.test(tin);

/**
 * Look up a taxpayer by TIN (ТТД). Returns null when the TIN is malformed,
 * unknown, or the service is unreachable — callers treat this as optional
 * enrichment and must not block on it.
 */
export async function lookupTaxpayer(
    tin: string
): Promise<TaxpayerInfo | null> {
    const trimmed = tin.trim();
    if (!isPlausibleTin(trimmed)) return null;

    try {
        const response = await fetch(
            `https://api.ebarimt.mn/api/info/check/getInfo?tin=${encodeURIComponent(trimmed)}`,
            {
                // The registry changes rarely; a day of caching keeps repeat
                // scans of the same shop off the network entirely.
                next: { revalidate: 86_400 },
                signal: AbortSignal.timeout(4000),
            }
        );

        if (!response.ok) return null;

        const body = (await response.json()) as GetInfoResponse;
        const data = body.data;
        if (!data?.found || !data.name) return null;

        return {
            name: data.name,
            vatPayer: data.vatPayer === true,
            isGovernment: data.isGovernment === true,
        };
    } catch {
        // Offline, timed out, or the service changed shape. Enrichment is
        // optional — the scan still succeeds without it.
        return null;
    }
}

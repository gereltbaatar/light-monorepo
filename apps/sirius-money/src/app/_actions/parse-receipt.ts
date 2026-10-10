"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { lookupTaxpayer } from "@/lib/ebarimt";
import { errorStatus, generateWithFallback } from "@workspace/sirius-core/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { sanitizeItems, type ReceiptItem } from "@/lib/receipt-items";
import { EXPENSE_CATEGORY_KEYS, toCategory, type Category } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
import { isAiFeatureEnabled } from "@/lib/ai-features-server";
import { aiFeaturesDict } from "@/lib/i18n/dictionaries/ai-features";
import { scanDict } from "@/lib/i18n/dictionaries/scan";

export interface ParsedReceipt {
    /** Merchant name, used as the transaction title. */
    merchant: string;
    /** Total the customer actually paid, in MNT. */
    total: number;
    /** yyyy-mm-dd, or null when the receipt has no readable date. */
    date: string | null;
    /**
     * Whether the line items add up to the total. When false the read is
     * suspect and the UI should make the user confirm rather than save silently.
     */
    confident: boolean;
    /**
     * Registered name for the receipt's ТТД, when the tax registry recognized
     * it. Corroborates that the receipt was read off a real merchant; it is
     * deliberately not used as the title, since the registered name is often
     * the holding company rather than the shop ("Одод" for a UBMART receipt).
     */
    registeredName?: string;
    /** Line items read off the receipt; empty when none were legible. */
    items: ReceiptItem[];
    category: Category;
}

export type ParseReceiptResult = ParsedReceipt | { error: string };

/**
 * Mongolian VAT receipts ("ebarimt") carry several money-shaped numbers and
 * only one of them is what the customer paid. Every rule below exists because
 * a real receipt would otherwise be misread:
 *
 *   - НӨАТ / НХАТ are *included* in the total, never added to it.
 *   - "Бэлэн мөнгө", "Хариулт", "Балансаас" describe the payment, not the bill.
 *   - Item lines repeat the price ("Royal mochi 1*8660 =8660") — the last
 *     number on the line is that line's total, not a second item.
 */
const SYSTEM_PROMPT = `You read Mongolian retail receipts (ebarimt) and return structured data.

The text is Mongolian Cyrillic, which includes the letters Ө/ө and Ү/ү that do not
exist in Russian. Read them as Mongolian, not Russian.

WHICH NUMBER IS THE TOTAL
Prefer these labels, in order, and stop at the first one present:
  1. "Төлөх дүн"     (amount payable)
  2. "Нийт дүн"      (total)
  3. "Нийт төлөлт"   (total paid)
  4. "Дэд дүн"       (subtotal — only when no total line exists)

NEVER treat these as the total:
  - "НӨАТ" / "НХАТ"  — these taxes are ALREADY INCLUDED in the total. Never add them.
  - "Бэлэн мөнгө", "Карт", "Хариулт", "Балансаас"  — payment method and change.
  - "Сугалааны дугаар", "ДДТД", "ТТД"  — lottery and tax ID numbers, not money.

READING ITEM LINES
A line like "1.Royal mochi   1*8660  =8660" is ONE item costing 8660.
The pattern is: name, quantity*unit-price, =line-total. Use the line total once.
Return every item line in "items" with name, quantity, unitPrice and total.
Keep the item name exactly as printed. Do not include tax, discount or payment lines.

MERCHANT
Use the shop name printed at the top (e.g. "RYO", "UBMART"). If the top shows
only a tax ID with no name, use the most recognizable brand text on the receipt.

DATE
Read "Огноо". Convert to yyyy-mm-dd. If absent or unreadable, return null.

TIN
Read the digits after "ТТД" (the merchant's tax number, typically 10-11 digits).
This is NOT the same as "ДДТД", which is a much longer receipt identifier — if you
see both, take only the short "ТТД" one. Return an empty string if absent.

CATEGORY
Pick the one category that best fits what was bought:
  food (groceries, supermarkets, restaurants), coffee (cafes, coffee shops),
  shopping (clothes, electronics, household goods), taxi (taxi, fuel, transport),
  entertainment (cinema, games, events), bills (utilities, phone, internet),
  health (pharmacy, clinic), other (anything else).
Judge by the merchant and the items together. When unsure, use "other".

SELF-CHECK
Sum the item line totals. If that sum equals the total you chose, set
confident=true. If they disagree, or you could not read the total clearly,
set confident=false. Do not guess a total to make the numbers work.

Amounts are Mongolian tugrik. Return integers with no separators or currency symbols.`;

const RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        merchant: {
            type: Type.STRING,
            description: "Shop name printed on the receipt",
        },
        total: {
            type: Type.INTEGER,
            description: "Amount the customer paid, in MNT",
        },
        date: {
            type: Type.STRING,
            description: "Receipt date as yyyy-mm-dd, or empty if unreadable",
        },
        confident: {
            type: Type.BOOLEAN,
            description: "True only when item totals reconcile with the total",
        },
        tin: {
            type: Type.STRING,
            description:
                "The ТТД / TIN digits printed on the receipt, or empty if absent",
        },
        category: {
            type: Type.STRING,
            format: "enum",
            enum: EXPENSE_CATEGORY_KEYS,
            description: "Spending category of the purchase",
        },
        items: {
            type: Type.ARRAY,
            description: "Every purchased item line on the receipt",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Item name as printed" },
                    quantity: { type: Type.NUMBER, description: "Quantity bought" },
                    unitPrice: { type: Type.NUMBER, description: "Price per unit in MNT" },
                    total: { type: Type.NUMBER, description: "Line total in MNT" },
                },
                required: ["name", "quantity", "unitPrice", "total"],
            },
        },
    },
    required: ["merchant", "total", "date", "confident", "tin", "category", "items"],
};

const SUPPORTED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
]);

export async function parseReceipt(
    formData: FormData
): Promise<ParseReceiptResult> {
    const t = (await getT(scanDict)).errors;
    if (!(await isAiFeatureEnabled("receipt"))) {
        return { error: (await getT(aiFeaturesDict)).disabledTitle };
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            error: t.notConfigured,
        };
    }

    const file = formData.get("receipt");
    if (!(file instanceof File)) {
        return { error: t.noImage };
    }

    const mimeType = file.type === "image/jpg" ? "image/jpeg" : file.type;
    if (!SUPPORTED_TYPES.has(mimeType)) {
        return { error: t.unsupportedType };
    }

    if (file.size > 7 * 1024 * 1024) {
        return { error: t.tooLarge };
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    try {
        const ai = new GoogleGenAI({ apiKey });

        const response = await generateWithFallback(await createClient(), ai, {
            contents: [
                {
                    role: "user",
                    parts: [
                        { inlineData: { mimeType, data: base64 } },
                        {
                            text: "Read this receipt and return the merchant, the amount actually paid, the date, every item line, and whether the line items reconcile.",
                        },
                    ],
                },
            ],
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
            },
        });

        const text = response.text;
        if (!text) {
            return { error: t.unreadable };
        }

        const parsed = JSON.parse(text) as Omit<ParsedReceipt, "items" | "category"> & {
            tin?: string;
            items?: unknown;
            category?: unknown;
        };

        if (!Number.isFinite(parsed.total) || parsed.total <= 0) {
            return { error: t.noAmount };
        }

        // The schema cannot express a nullable string, so an unreadable date
        // comes back as "" — normalize it to null for callers.
        const date = parsed.date?.trim() ? parsed.date.trim() : null;

        // Best-effort corroboration against the public tax registry. Never
        // blocks the scan: an unknown TIN or an unreachable registry just
        // means no extra confirmation.
        const registered = parsed.tin
            ? await lookupTaxpayer(parsed.tin)
            : null;

        return {
            merchant: parsed.merchant?.trim() || t.fallbackMerchant,
            total: Math.round(parsed.total),
            date,
            confident: parsed.confident === true,
            registeredName: registered?.name,
            items: sanitizeItems(parsed.items),
            category: toCategory(parsed.category),
        };
    } catch (error) {
        console.error("[parseReceipt]", error);
        const status = errorStatus(error);
        if (status === 503) {
            return { error: t.busy };
        }
        if (status === 429) {
            return { error: t.quota };
        }
        const message = error instanceof Error ? error.message : String(error);
        return { error: t.failed(message.slice(0, 200)) };
    }
}

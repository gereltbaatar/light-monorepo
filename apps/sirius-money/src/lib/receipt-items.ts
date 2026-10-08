export interface ReceiptItem {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

const MAX_ITEMS = 200;

// Items arrive from the model and the client, so coerce and drop anything malformed.
export function sanitizeItems(raw: unknown): ReceiptItem[] {
    if (!Array.isArray(raw)) return [];

    const items: ReceiptItem[] = [];
    for (const entry of raw.slice(0, MAX_ITEMS)) {
        if (!entry || typeof entry !== "object") continue;
        const { name, quantity, unitPrice, total } = entry as Record<string, unknown>;

        const cleanName = typeof name === "string" ? name.trim().slice(0, 200) : "";
        const qty = Number(quantity);
        const price = Number(unitPrice);
        const lineTotal = Number(total);
        if (!cleanName || !Number.isFinite(lineTotal) || lineTotal <= 0) continue;

        const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
        items.push({
            name: cleanName,
            quantity: safeQty,
            unitPrice:
                Number.isFinite(price) && price > 0 ? price : lineTotal / safeQty,
            total: lineTotal,
        });
    }
    return items;
}

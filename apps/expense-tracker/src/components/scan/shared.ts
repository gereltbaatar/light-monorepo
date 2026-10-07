export const inputClass =
    "h-12 px-4 rounded-2xl bg-surface text-foreground placeholder:text-muted-foreground border-border";

export const labelClass = "text-sm text-muted-foreground";

export const submitButtonClass =
    "w-full rounded-full py-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60";

export const ghostButtonClass =
    "w-full rounded-full py-6 text-base font-semibold bg-surface-2 text-foreground hover:bg-surface-2/80";

import type { ReceiptItem } from "@/lib/receipt-items";
import type { Category } from "@/lib/categories";

export type TransactionType = "expense" | "income";

/** What the scan step hands to the manual form to prefill it. */
export interface ScannedDraft {
    title: string;
    amount: string;
    type: TransactionType;
    receiptUrl?: string;
    items?: ReceiptItem[];
    category?: Category;
}

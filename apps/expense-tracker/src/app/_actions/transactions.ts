"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeItems, type ReceiptItem } from "@/lib/receipt-items";
import { toCategory, type Category } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
import { transactionsDict } from "@/lib/i18n/dictionaries/transactions";

export type TransactionActionResult = { error: string } | { ok: true; id?: string };

export interface SaveTransactionInput {
    type: "expense" | "income";
    title: string;
    amount: number;
    /** yyyy-mm-dd from the date input. */
    occurredAt: string;
    receiptUrl?: string;
    items?: ReceiptItem[];
    category?: Category;
}

type Errors = (typeof transactionsDict)["en"]["errors"];

function validate(input: SaveTransactionInput, t: Errors): string | null {
    if (!input.title.trim()) return t.titleRequired;
    if (!Number.isFinite(input.amount) || input.amount <= 0) return t.amountPositive;
    if (input.type !== "expense" && input.type !== "income") return t.invalidType;
    return null;
}

function toRow(input: SaveTransactionInput, userId: string) {
    const items = sanitizeItems(input.items);
    const category = toCategory(input.category);
    return {
        user_id: userId,
        type: input.type,
        title: input.title.trim(),
        amount: input.amount,
        occurred_at: input.occurredAt,
        receipt_url: input.receiptUrl ?? null,
        // Omitted when empty so manual entries still save before the items column exists.
        ...(items.length ? { items } : {}),
        ...(category !== "other" ? { category } : {}),
    };
}

// Say plainly which setup step is missing rather than surfacing PostgREST's opaque errors.
function describeInsertError(error: { code?: string; message: string }, t: Errors) {
    if (error.code === "PGRST204" && error.message.includes("items")) return t.itemsColumnMissing;
    if (error.code === "PGRST204" && error.message.includes("category")) return t.categoryColumnMissing;
    if (error.code === "42P01" || error.message.includes("does not exist")) return t.tableMissing;
    return error.message;
}

export async function saveTransaction(
    input: SaveTransactionInput
): Promise<TransactionActionResult> {
    const result = await saveTransactions([input]);
    return "error" in result ? result : { ok: true, id: result.ids[0] };
}

export type SaveTransactionsResult = { error: string } | { ok: true; ids: string[] };

// One insert, so a batch is saved whole or not at all.
export async function saveTransactions(
    inputs: SaveTransactionInput[]
): Promise<SaveTransactionsResult> {
    const t = (await getT(transactionsDict)).errors;
    if (inputs.length === 0) return { error: t.amountPositive };

    for (const input of inputs) {
        const invalid = validate(input, t);
        if (invalid) return { error: invalid };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: t.signedOut };

    // A row with items must not be sent alongside rows without, or PostgREST fills the gap with null.
    const rows = inputs.map((input) => toRow(input, user.id));
    const withItems = rows.some((row) => "items" in row);
    const withCategory = rows.some((row) => "category" in row);
    const normalized = rows.map((row) => ({
        ...row,
        ...(withItems && !("items" in row) ? { items: [] } : {}),
        ...(withCategory && !("category" in row) ? { category: "other" } : {}),
    }));

    const { data, error } = await supabase.from("transactions").insert(normalized).select("id");
    if (error) return { error: describeInsertError(error, t) };

    revalidatePath("/");
    revalidatePath("/all-transactions");
    return { ok: true, ids: (data ?? []).map((row) => row.id as string) };
}

export interface UpdateTransactionInput {
    type: "expense" | "income";
    title: string;
    amount: number;
    occurredAt: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function updateTransaction(
    id: string,
    input: UpdateTransactionInput
): Promise<TransactionActionResult> {
    const t = (await getT(transactionsDict)).errors;
    const title = input.title.trim();

    if (!title) {
        return { error: t.titleRequired };
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
        return { error: t.amountPositive };
    }
    if (input.type !== "expense" && input.type !== "income") {
        return { error: t.invalidType };
    }
    if (!DATE_PATTERN.test(input.occurredAt)) {
        return { error: t.invalidDate };
    }

    const supabase = await createClient();

    // RLS hides other users' rows, so a foreign id updates nothing rather than erroring.
    const { data, error } = await supabase
        .from("transactions")
        .update({
            type: input.type,
            title,
            amount: input.amount,
            occurred_at: input.occurredAt,
        })
        .eq("id", id)
        .select("id");

    if (error) {
        return { error: error.message };
    }
    if (!data?.length) {
        return { error: t.notFound };
    }

    revalidatePath("/");
    revalidatePath("/all-transactions");
    revalidatePath(`/transactions/${id}`);
    return { ok: true };
}

export async function deleteTransaction(
    id: string
): Promise<TransactionActionResult> {
    const t = (await getT(transactionsDict)).errors;
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .select("id");

    if (error) {
        return { error: error.message };
    }
    if (!data?.length) {
        return { error: t.notFound };
    }

    revalidatePath("/");
    revalidatePath("/all-transactions");
    return { ok: true };
}

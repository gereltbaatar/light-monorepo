"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@/lib/utils";
import {
    inputClass,
    labelClass,
    type ScannedDraft,
    type TransactionType,
} from "./shared";
import { useT } from "@/lib/i18n/client";
import { scanDict } from "@/lib/i18n/dictionaries/scan";

interface ManualEntryFormProps {
    /** Prefilled values when arriving from the scan step. */
    draft?: ScannedDraft;
    /** Receipt awaiting upload, if the user scanned one. */
    receiptFile?: File | null;
    onSaved: () => void;
}

const todayInputValue = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

export const ManualEntryForm = ({
    draft,
    receiptFile,
    onSaved,
}: ManualEntryFormProps) => {
    const t = useT(scanDict);
    const [type, setType] = useState<TransactionType>(draft?.type ?? "expense");
    const [title, setTitle] = useState(draft?.title ?? "");
    const [amount, setAmount] = useState(draft?.amount ?? "");
    const [date, setDate] = useState(todayInputValue());

    // The scan result lands after this form has already mounted, so seeding
    // state at first render would leave the fields empty. Re-seed whenever a
    // new draft arrives, keyed so the user's own edits are never clobbered.
    const [seededFrom, setSeededFrom] = useState(draft);
    if (draft !== seededFrom) {
        setSeededFrom(draft);
        setType(draft?.type ?? "expense");
        setTitle(draft?.title ?? "");
        setAmount(draft?.amount ?? "");
    }
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({ title: "", amount: "" });

    const validate = () => {
        const next = { title: "", amount: "" };

        if (!title.trim()) {
            next.title = t.titleRequired;
        }

        const parsed = Number(amount);
        if (!amount.trim()) {
            next.amount = t.amountRequired;
        } else if (!Number.isFinite(parsed) || parsed <= 0) {
            next.amount = t.amountPositive;
        }

        setErrors(next);
        return !next.title && !next.amount;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validate()) return;

        setIsSaving(true);
        try {
            const { saveTransaction } = await import(
                "@/app/_actions/transactions"
            );

            let receiptUrl = draft?.receiptUrl;
            if (receiptFile && !receiptUrl) {
                const { uploadToCloudinary } = await import("@/lib/cloudinary");
                receiptUrl = await uploadToCloudinary(receiptFile);
            }

            const result = await saveTransaction({
                type,
                title: title.trim(),
                amount: Number(amount),
                occurredAt: date,
                receiptUrl,
                items: draft?.items,
                category: type === "expense" ? draft?.category : undefined,
            });

            if ("error" in result) {
                toast.error(result.error);
                return;
            }

            toast.success(
                type === "expense" ? t.expenseSaved : t.incomeSaved
            );
            onSaved();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : t.couldNotSave
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-4">
            {/* Expense / Income switch */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-[20px] bg-surface-2">
                <TypeTab
                    active={type === "expense"}
                    onClick={() => setType("expense")}
                    icon={<ArrowUpRight className="h-4 w-4" strokeWidth={2.4} />}
                    label={t.expense}
                    tone="expense"
                />
                <TypeTab
                    active={type === "income"}
                    onClick={() => setType("income")}
                    icon={<ArrowDownLeft className="h-4 w-4" strokeWidth={2.4} />}
                    label={t.income}
                    tone="income"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="transaction-title" className={labelClass}>
                    {t.title}
                </Label>
                <Input
                    id="transaction-title"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setErrors((prev) => ({ ...prev, title: "" }));
                    }}
                    placeholder={
                        type === "expense" ? t.expensePlaceholder : t.incomePlaceholder
                    }
                    className={cn(inputClass, errors.title && "border-destructive")}
                />
                {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="transaction-amount" className={labelClass}>
                    {t.amount}
                </Label>
                <Input
                    id="transaction-amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                        setAmount(e.target.value);
                        setErrors((prev) => ({ ...prev, amount: "" }));
                    }}
                    placeholder="0"
                    className={cn(inputClass, errors.amount && "border-destructive")}
                />
                {errors.amount && (
                    <p className="text-sm text-destructive">{errors.amount}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="transaction-date" className={labelClass}>
                    {t.date}
                </Label>
                <Input
                    id="transaction-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                />
            </div>

            {receiptFile && (
                <p className="text-sm text-muted-foreground">
                    {t.receiptAttached}
                </p>
            )}

            <motion.button
                type="submit"
                disabled={isSaving}
                whileTap={{ scale: 0.985 }}
                className={cn(
                    "flex h-[58px] w-full items-center justify-center gap-2 rounded-full text-[17px] font-semibold text-white transition-colors",
                    "disabled:opacity-60",
                    type === "expense"
                        ? "bg-accent-orange shadow-[0_8px_24px_-8px_rgba(255,111,55,0.75)] hover:bg-accent-orange/90"
                        : "bg-success shadow-[0_8px_24px_-8px_rgba(0,168,107,0.75)] hover:bg-success/90"
                )}
            >
                {isSaving ? (
                    <>
                        <Spinner className="size-[18px]" />
                        {t.saving}
                    </>
                ) : (
                    type === "expense" ? t.saveExpense : t.saveIncome
                )}
            </motion.button>
        </form>
    );
};

/**
 * Segmented control. The active pill is a shared layout element so it slides
 * between the two options instead of snapping.
 */
const TypeTab = ({
    active,
    onClick,
    icon,
    label,
    tone,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    tone: "expense" | "income";
}) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className="relative flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-colors"
    >
        {active && (
            <motion.span
                layoutId="type-tab-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-2xl bg-background shadow-[0_2px_10px_-2px_rgba(0,0,0,0.12)] dark:bg-white/15"
            />
        )}
        <span
            className={cn(
                "relative z-10 flex items-center gap-2 transition-colors",
                active
                    ? tone === "expense"
                        ? "text-accent-orange"
                        : "text-success"
                    : "text-muted-foreground"
            )}
        >
            {icon}
            {label}
        </span>
    </button>
);

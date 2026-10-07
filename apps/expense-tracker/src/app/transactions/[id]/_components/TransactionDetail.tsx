"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@/lib/utils";
import { moneyFormatter } from "@/components/functions";
import { inputClass, labelClass } from "@/components/scan/shared";
import {
    deleteTransaction,
    updateTransaction,
} from "@/app/_actions/transactions";
import type { TransactionDetail as TransactionDetailData } from "@/lib/transactions";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { useLocale, useT } from "@/lib/i18n/client";
import { transactionsDict } from "@/lib/i18n/dictionaries/transactions";

export const TransactionDetail = ({
    transaction,
}: {
    transaction: TransactionDetailData;
}) => {
    const router = useRouter();
    const locale = useLocale();
    const t = useT(transactionsDict);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [type, setType] = useState(transaction.type);
    const [title, setTitle] = useState(transaction.title);
    const [amount, setAmount] = useState(String(transaction.amount));
    const [date, setDate] = useState(transaction.occurred_at);

    const isIncome = transaction.type === "income";
    const occurredLabel = new Date(
        `${transaction.occurred_at}T00:00:00`
    ).toLocaleDateString(INTL_LOCALE[locale], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const createdLabel = new Date(transaction.created_at).toLocaleString(
        INTL_LOCALE[locale],
        { dateStyle: "medium", timeStyle: "short" }
    );

    const resetForm = () => {
        setType(transaction.type);
        setTitle(transaction.title);
        setAmount(String(transaction.amount));
        setDate(transaction.occurred_at);
        setIsEditing(false);
    };

    const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        try {
            const result = await updateTransaction(transaction.id, {
                type,
                title,
                amount: Number(amount),
                occurredAt: date,
            });
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(t.updated);
            setIsEditing(false);
            router.refresh();
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        setIsDeleting(true);
        const result = await deleteTransaction(transaction.id);
        if ("error" in result) {
            toast.error(result.error);
            setIsDeleting(false);
            setConfirmDelete(false);
            return;
        }
        toast.success(t.deleted);
        router.replace("/all-transactions");
    };

    return (
        <>
            <div className="flex items-center justify-center relative px-4 py-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-foreground hover:bg-surface-2 transition-colors absolute left-4"
                    aria-label={t.back}
                >
                    <ChevronLeft size={30} />
                </button>
                <h1 className="text-2xl font-bold text-foreground">{t.details}</h1>
                {!isEditing && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center justify-center w-10 h-10 rounded-full text-foreground hover:bg-surface-2 transition-colors absolute right-4"
                        aria-label={t.editTransaction}
                    >
                        <Pencil size={22} />
                    </button>
                )}
            </div>

            {isEditing ? (
                <form onSubmit={handleSave} className="px-4 pt-2 space-y-4">
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-[20px] bg-surface-2">
                        {(["expense", "income"] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setType(option)}
                                aria-pressed={type === option}
                                className={cn(
                                    "rounded-2xl py-3.5 text-sm font-semibold capitalize transition-colors",
                                    type === option
                                        ? "bg-background shadow-[0_2px_10px_-2px_rgba(0,0,0,0.12)] dark:bg-white/15"
                                        : "text-muted-foreground",
                                    type === option &&
                                        (option === "expense"
                                            ? "text-accent-orange"
                                            : "text-success")
                                )}
                            >
                                {option === "expense" ? t.expense : t.income}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="detail-title" className={labelClass}>
                            {t.title}
                        </Label>
                        <Input
                            id="detail-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="detail-amount" className={labelClass}>
                            {t.amount}
                        </Label>
                        <Input
                            id="detail-amount"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="detail-date" className={labelClass}>
                            {t.date}
                        </Label>
                        <Input
                            id="detail-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="h-[54px] rounded-full bg-surface-2 text-base font-semibold text-foreground"
                        >
                            {t.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex h-[54px] items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                        >
                            {isSaving && (
                                <Spinner className="size-[18px]" />
                            )}
                            {t.save}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="px-4 pt-4 space-y-6">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div
                            className={cn(
                                "w-[72px] h-[72px] rounded-full flex items-center justify-center",
                                isIncome ? "bg-income-soft" : "bg-expense-soft"
                            )}
                        >
                            {isIncome ? (
                                <ArrowDown className="w-8 h-8 text-income" />
                            ) : (
                                <ArrowUp className="w-8 h-8 text-expense" />
                            )}
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                            {transaction.title}
                        </p>
                        <p
                            className={cn(
                                "text-4xl font-bold",
                                isIncome ? "text-income" : "text-expense"
                            )}
                        >
                            {isIncome ? "+" : "-"} {moneyFormatter(transaction.amount)}
                        </p>
                    </div>

                    <dl className="rounded-3xl bg-surface divide-y divide-border dark:border dark:border-border">
                        <DetailRow label={t.type} value={isIncome ? t.income : t.expense} />
                        <DetailRow label={t.date} value={occurredLabel} />
                        <DetailRow label={t.added} value={createdLabel} />
                    </dl>

                    {transaction.items.length > 0 && (
                        <ReceiptItems items={transaction.items} total={transaction.amount} />
                    )}

                    {transaction.receipt_url && (
                        <div className="space-y-2">
                            <p className={labelClass}>{t.receipt}</p>
                            <Link
                                href={transaction.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded-3xl bg-surface dark:border dark:border-border"
                            >
                                <Image
                                    src={transaction.receipt_url}
                                    alt={t.receiptAlt(transaction.title)}
                                    width={800}
                                    height={1200}
                                    className="w-full h-auto"
                                />
                            </Link>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={cn(
                            "flex h-[54px] w-full items-center justify-center gap-2 rounded-full text-base font-semibold transition-colors disabled:opacity-60",
                            confirmDelete
                                ? "bg-expense text-white"
                                : "bg-expense-soft text-expense"
                        )}
                    >
                        {isDeleting ? (
                            <Spinner className="size-[18px]" />
                        ) : (
                            <Trash2 className="h-[18px] w-[18px]" />
                        )}
                        {confirmDelete ? t.confirmDelete : t.deleteTransaction}
                    </button>
                </div>
            )}
        </>
    );
};

const ReceiptItems = ({
    items,
    total,
}: {
    items: TransactionDetailData["items"];
    total: number;
}) => {
    const t = useT(transactionsDict);
    const itemsSum = items.reduce((sum, item) => sum + item.total, 0);
    const reconciles = Math.round(itemsSum) === Math.round(total);

    return (
        <div className="space-y-2">
            <p className={labelClass}>
                {t.items(items.length)}
            </p>
            <ul className="rounded-3xl bg-surface divide-y divide-border dark:border dark:border-border">
                {items.map((item, index) => (
                    <li
                        key={`${item.name}-${index}`}
                        className="flex items-start justify-between gap-4 px-5 py-4"
                    >
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground break-words">
                                {item.name}
                            </p>
                            <p className="pt-0.5 text-xs text-muted-foreground">
                                {item.quantity} × {moneyFormatter(item.unitPrice)}
                            </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-foreground">
                            {moneyFormatter(item.total)}
                        </p>
                    </li>
                ))}
                <li className="flex items-center justify-between gap-4 px-5 py-4">
                    <p className="text-sm text-muted-foreground">{t.itemsTotal}</p>
                    <p
                        className={cn(
                            "text-sm font-bold",
                            reconciles ? "text-foreground" : "text-accent-orange"
                        )}
                    >
                        {moneyFormatter(itemsSum)}
                    </p>
                </li>
            </ul>
            {!reconciles && (
                <p className="text-xs text-accent-orange">
                    {t.itemsMismatch(moneyFormatter(itemsSum), moneyFormatter(total))}
                </p>
            )}
        </div>
    );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="text-sm font-semibold text-foreground text-right">{value}</dd>
    </div>
);

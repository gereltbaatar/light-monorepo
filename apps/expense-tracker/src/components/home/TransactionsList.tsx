"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { TransactionsCard } from "./TransactionsCard";
import { TransactionsCardProps } from "./type";
import { deleteTransaction } from "@/app/_actions/transactions";
import { useT } from "@/lib/i18n/client";
import { homeDict } from "@/lib/i18n/dictionaries/home";

interface TransactionsListProps {
    /** Transactions already grouped by date label, in display order. */
    grouped: Array<{ label: string; items: TransactionsCardProps[] }>;
}

export const TransactionsList = ({ grouped }: TransactionsListProps) => {
    const router = useRouter();
    const t = useT(homeDict);
    const [openCardId, setOpenCardId] = useState<string | null>(null);

    const handleDelete = async (tx: TransactionsCardProps) => {
        if (!window.confirm(t.transactions.confirmDelete(tx.title))) return;
        const result = await deleteTransaction(tx.id);
        if ("error" in result) {
            toast.error(result.error);
            return;
        }
        setOpenCardId(null);
        toast.success(t.transactions.deleted);
        router.refresh();
    };

    return (
        <div className="flex flex-col gap-6">
            {grouped.map(({ label, items }) => (
                <div key={label} className="flex flex-col gap-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {label}
                    </h2>

                    <div className="flex flex-col gap-3">
                        {items.map((tx) => (
                            <TransactionsCard
                                key={tx.id}
                                id={tx.id}
                                cardId={tx.id}
                                isOpen={openCardId === tx.id}
                                onSwipeOpen={setOpenCardId}
                                onSwipeClose={() => setOpenCardId(null)}
                                onOpen={() => router.push(`/transactions/${tx.id}`)}
                                onEdit={() => router.push(`/transactions/${tx.id}`)}
                                onDelete={() => handleDelete(tx)}
                                transactionType={tx.transactionType}
                                title={tx.title}
                                amount={tx.amount}
                                timestamp={tx.timestamp}
                                category={tx.category}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

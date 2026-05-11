"use client";

import { useState } from "react";
import { TransactionsCard } from "./TransactionsCard";
import { TransactionsCardProps } from "./type";

interface TransactionsListProps {
    /** Transactions already grouped by date label, in display order. */
    grouped: Array<{ label: string; items: TransactionsCardProps[] }>;
}

export const TransactionsList = ({ grouped }: TransactionsListProps) => {
    const [openCardId, setOpenCardId] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-6">
            {grouped.map(({ label, items }) => (
                <div key={label} className="flex flex-col gap-3">
                    <h2 className="text-sm font-semibold text-[#8E8E93] uppercase tracking-wide">
                        {label}
                    </h2>

                    <div className="flex flex-col gap-3">
                        {items.map((tx, index) => {
                            const cardId = `${label}-${index}`;
                            return (
                                <TransactionsCard
                                    key={cardId}
                                    cardId={cardId}
                                    isOpen={openCardId === cardId}
                                    onSwipeOpen={setOpenCardId}
                                    onSwipeClose={() => setOpenCardId(null)}
                                    transactionType={tx.transactionType}
                                    title={tx.title}
                                    amount={tx.amount}
                                    timestamp={tx.timestamp}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

import Link from "next/link";
import { TransactionsList } from "./TransactionsList";
import { TransactionsCardProps } from "./type";
import { getTransactions } from "@/lib/transactions";
import { groupByDateLabel } from "@/components/functions/DateFormatter";
import { getLocale } from "@/lib/i18n/server";
import { homeDict } from "@/lib/i18n/dictionaries/home";

export const Transactions = async () => {
    const transactions = await getTransactions(20);
    const locale = await getLocale();
    const t = homeDict[locale];

    const cards: TransactionsCardProps[] = transactions.map((tx) => ({
        id: tx.id,
        transactionType: tx.type,
        title: tx.title,
        amount: String(tx.amount),
        category: tx.category,
        // The list groups and formats by day; occurred_at is a date, so anchor
        // it at local midnight rather than letting UTC shift it a day back.
        timestamp: new Date(`${tx.occurred_at}T00:00:00`).toISOString(),
    }));

    const groupedMap = groupByDateLabel(cards, locale);
    const grouped = Object.entries(groupedMap).map(([label, items]) => ({
        label,
        items,
    }));

    return (
        <div className="px-4 pb-6">
            <div className="flex items-center justify-between mb-4">
                {/* title */}
                <h1 className="text-2xl font-bold text-foreground">{t.transactions.title}</h1>

                {/* see all button */}
                <Link
                    href="/all-transactions"
                    className="text-foreground font-medium hover:text-foreground/80 transition-colors"
                >
                    {t.transactions.seeAll}
                </Link>
            </div>

            {grouped.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
                    <p className="text-base font-semibold text-foreground">
                        {t.transactions.emptyTitle}
                    </p>
                    <p className="pt-1 text-sm text-muted-foreground">
                        {t.transactions.emptyHint}
                    </p>
                </div>
            ) : (
                <TransactionsList grouped={grouped} />
            )}
        </div>
    );
};

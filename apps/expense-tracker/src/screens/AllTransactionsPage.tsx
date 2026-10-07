import { TransactionsList } from "@/components/home/TransactionsList";
import { TransactionsCardProps } from "@/components/home/type";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AllTranHeader } from "@/app/all-transactions/_components";
import { getTransactions } from "@/lib/transactions";
import { groupByDateLabel } from "@/components/functions/DateFormatter";
import { getLocale, getT } from "@/lib/i18n/server";
import { transactionsDict } from "@/lib/i18n/dictionaries/transactions";

const AllTransactionsPage = async () => {
    // The home screen shows a recent slice; this page is the full history.
    const transactions = await getTransactions(500);
    const t = await getT(transactionsDict);

    const cards: TransactionsCardProps[] = transactions.map((tx) => ({
        id: tx.id,
        transactionType: tx.type,
        title: tx.title,
        amount: String(tx.amount),
        category: tx.category,
        // occurred_at is a date — anchor at local midnight so the day label
        // doesn't slip backwards through UTC.
        timestamp: new Date(`${tx.occurred_at}T00:00:00`).toISOString(),
    }));

    const grouped = Object.entries(groupByDateLabel(cards, await getLocale())).map(
        ([label, items]) => ({ label, items })
    );

    return (
        <div className="min-h-screen bg-background pb-32">
            <div className="max-w-[430px] mx-auto">
                <AllTranHeader />

                <div className="px-4 py-6">
                    {grouped.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
                            <p className="text-base font-semibold text-foreground">
                                {t.emptyTitle}
                            </p>
                            <p className="pt-1 text-sm text-muted-foreground">
                                {t.emptyHint}
                            </p>
                        </div>
                    ) : (
                        <TransactionsList grouped={grouped} />
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default AllTransactionsPage;

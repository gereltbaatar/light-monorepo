import { notFound } from "next/navigation";
import { getTransaction } from "@/lib/transactions";
import { TransactionDetail } from "@/app/transactions/[id]/_components/TransactionDetail";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TransactionDetailPage = async ({ id }: { id: string }) => {
    // Postgres rejects a malformed uuid with an error, so 404 before querying.
    if (!UUID_PATTERN.test(id)) notFound();

    const transaction = await getTransaction(id);
    if (!transaction) notFound();

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="max-w-[430px] mx-auto">
                <TransactionDetail transaction={transaction} />
            </div>
        </div>
    );
};

export default TransactionDetailPage;

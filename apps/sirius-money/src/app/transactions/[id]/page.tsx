import TransactionDetailPage from "@/screens/TransactionDetailPage";

export default async function TransactionDetail({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <TransactionDetailPage id={id} />;
}

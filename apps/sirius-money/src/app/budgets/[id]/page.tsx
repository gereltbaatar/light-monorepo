import BudgetDetailPage from "@/screens/BudgetDetailPage";

export default async function BudgetDetail({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <BudgetDetailPage id={id} />;
}

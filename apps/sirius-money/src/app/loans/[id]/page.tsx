import LoanDetailPage from "@/screens/LoanDetailPage";

export default async function LoanDetail({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <LoanDetailPage id={id} />;
}

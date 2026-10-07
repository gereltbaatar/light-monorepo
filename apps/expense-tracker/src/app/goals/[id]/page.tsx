import GoalDetailPage from "@/screens/GoalDetailPage";

export default async function GoalDetail({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <GoalDetailPage id={id} />;
}

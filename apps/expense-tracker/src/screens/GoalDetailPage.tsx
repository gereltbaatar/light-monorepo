import { notFound } from "next/navigation";
import { getGoal, getGoalContributions } from "@/lib/goals";
import { GoalDetail } from "@/app/goals/[id]/_components/GoalDetail";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GoalDetailPage = async ({ id }: { id: string }) => {
    if (!UUID_PATTERN.test(id)) notFound();

    const [goal, contributions] = await Promise.all([
        getGoal(id),
        getGoalContributions(id),
    ]);
    if (!goal) notFound();

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="max-w-[430px] mx-auto">
                <GoalDetail goal={goal} contributions={contributions} />
            </div>
        </div>
    );
};

export default GoalDetailPage;

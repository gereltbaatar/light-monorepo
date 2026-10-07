import { getGoals } from "@/lib/goals";
import { GoalsBudgets } from "./GoalsBudgets";

export const Goals = async () => {
    const goals = await getGoals();
    return <GoalsBudgets goals={goals} />;
};

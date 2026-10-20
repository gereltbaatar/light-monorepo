import { syncBudgetTasks } from "@/lib/budget-tasks";
import { getBudgets } from "@/lib/budgets";
import { getGoals } from "@/lib/goals";
import { GoalsBudgets } from "./GoalsBudgets";

export const Goals = async () => {
    await syncBudgetTasks();
    const [goals, budgets] = await Promise.all([getGoals(), getBudgets()]);
    return <GoalsBudgets goals={goals} budgets={budgets} />;
};

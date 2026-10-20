"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// Imported directly rather than through the barrel: this is a client
// component, and the barrel also re-exports server-only modules (Transactions,
// TotalBalance) that would then be pulled into the browser bundle.
import { GoalCard } from "./GoalCard";
import { BudgetCard } from "./BudgetCard";
import { AddNewDrawer } from "./AddNewDrawer";
import type { Budget } from "@/lib/budgets";
import type { Goal } from "@/lib/goals";

export const GoalsBudgets = ({ goals, budgets }: { goals: Goal[]; budgets: Budget[] }) => {
    const router = useRouter();
    const [pickerOpen, setPickerOpen] = useState(false);

    const openGoalForm = () => {
        setPickerOpen(false);
        router.push("/goals/new");
    };

    const openBudgetForm = () => {
        setPickerOpen(false);
        router.push("/budgets/new");
    };

    return (
        <div className="w-full pl-4 py-4 flex flex-nowrap gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <AddNewDrawer
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onPickGoal={openGoalForm}
                onPickBudget={openBudgetForm}
            />

            {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
            ))}
            {budgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
            ))}
        </div>
    );
};

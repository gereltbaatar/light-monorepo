"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// Imported directly rather than through the barrel: this is a client
// component, and the barrel also re-exports server-only modules (Transactions,
// TotalBalance) that would then be pulled into the browser bundle.
import { GoalCard } from "./GoalCard";
import { BudgetCard } from "./BudgetCard";
import { AddNewDrawer } from "./AddNewDrawer";
import { NewBudgetDrawer } from "./NewBudgetDrawer";
import type { Goal } from "@/lib/goals";

// Time vaul needs to play its exit animation before opening the next drawer.
// Without this delay two drawers fight over the body-scroll lock and focus
// trap (Radix Dialog allows only one open at a time).
const DRAWER_TRANSITION_MS = 220;

export const GoalsBudgets = ({ goals }: { goals: Goal[] }) => {
    const router = useRouter();
    const [pickerOpen, setPickerOpen] = useState(false);
    const [budgetFormOpen, setBudgetFormOpen] = useState(false);

    const openGoalForm = () => {
        setPickerOpen(false);
        router.push("/goals/new");
    };

    const openBudgetForm = () => {
        setPickerOpen(false);
        setTimeout(() => setBudgetFormOpen(true), DRAWER_TRANSITION_MS);
    };

    return (
        <div className="w-full pl-4 py-4 flex flex-nowrap gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <AddNewDrawer
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onPickGoal={openGoalForm}
                onPickBudget={openBudgetForm}
            />

            <NewBudgetDrawer open={budgetFormOpen} onOpenChange={setBudgetFormOpen} />

            {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
            ))}
            <BudgetCard />
        </div>
    );
};

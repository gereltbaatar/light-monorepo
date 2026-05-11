"use client";

import { useState } from "react";
import { GoalCard, BudgetCard } from "./";
import { AddNewDrawer } from "./AddNewDrawer";
import { NewGoalDrawer } from "./NewGoalDrawer";
import { NewBudgetDrawer } from "./NewBudgetDrawer";

// Time vaul needs to play its exit animation before opening the next drawer.
// Without this delay two drawers fight over the body-scroll lock and focus
// trap (Radix Dialog allows only one open at a time).
const DRAWER_TRANSITION_MS = 220;

export const GoalsBudgets = () => {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [goalFormOpen, setGoalFormOpen] = useState(false);
    const [budgetFormOpen, setBudgetFormOpen] = useState(false);

    const openGoalForm = () => {
        setPickerOpen(false);
        setTimeout(() => setGoalFormOpen(true), DRAWER_TRANSITION_MS);
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

            <NewGoalDrawer open={goalFormOpen} onOpenChange={setGoalFormOpen} />
            <NewBudgetDrawer open={budgetFormOpen} onOpenChange={setBudgetFormOpen} />

            <GoalCard />
            <BudgetCard />
            <GoalCard />
            <GoalCard />
        </div>
    );
};

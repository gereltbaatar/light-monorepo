import { Ellipsis, Plus } from "lucide-react";
import { GoalCard, BudgetCard } from "./";


export const GoalsBudgets = () => {
    return (
        <div className="w-full pl-4 py-4 flex flex-nowrap gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <div className="h-[220px] w-10 shrink-0 bg-white">
                <div className="border-3 h-full w-full border-dashed border-[#DEE2E6] flex items-center justify-center rounded-xl">
                    <Plus color="#343A40" size={20} strokeWidth={3} />
                </div>
            </div>

            <GoalCard />
            <BudgetCard />
            <GoalCard />
            <GoalCard />
        </div>
    );
};
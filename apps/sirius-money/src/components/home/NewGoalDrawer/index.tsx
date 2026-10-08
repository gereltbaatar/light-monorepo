"use client";

import { useState } from "react";
import { PiggyBank, CalendarClock } from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from "@workspace/ui/components/drawer";
import { useT } from "@/lib/i18n/client";
import { goalsDict } from "@/lib/i18n/dictionaries/goals";
import { GoalKindTab } from "./GoalKindTab";
import { SavingsGoalForm } from "./SavingsGoalForm";
import { ContributionGoalForm } from "./ContributionGoalForm";

interface NewGoalDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type GoalKind = "savings" | "contribution";

export const NewGoalDrawer = ({ open, onOpenChange }: NewGoalDrawerProps) => {
    const t = useT(goalsDict);
    const [kind, setKind] = useState<GoalKind>("savings");

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);
        // Reset to default tab when the drawer closes so the next open starts fresh.
        if (!next) setKind("savings");
    };

    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerContent className="bg-background border-0 rounded-t-[28px] *:first:hidden">
                <div className="mx-auto w-full max-w-[430px]">
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="h-1 w-10 rounded-full bg-surface-2" />
                    </div>

                    <div className="px-5 pt-4 pb-4">
                        <DrawerTitle className="text-2xl font-bold text-foreground tracking-tight">
                            {t.addNewGoal}
                        </DrawerTitle>
                    </div>

                    <div className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-2">
                            <GoalKindTab
                                active={kind === "savings"}
                                onClick={() => setKind("savings")}
                                icon={
                                    <PiggyBank
                                        className="w-4 h-4"
                                        strokeWidth={2.2}
                                    />
                                }
                                label={t.savings}
                                sublabel={t.savingsHint}
                            />
                            <GoalKindTab
                                active={kind === "contribution"}
                                onClick={() => setKind("contribution")}
                                icon={
                                    <CalendarClock
                                        className="w-4 h-4"
                                        strokeWidth={2.2}
                                    />
                                }
                                label={t.plan}
                                sublabel={t.planHint}
                            />
                        </div>
                    </div>

                    {kind === "savings" ? (
                        <SavingsGoalForm
                            onSubmitDone={() => onOpenChange(false)}
                        />
                    ) : (
                        <ContributionGoalForm
                            onSubmitDone={() => onOpenChange(false)}
                        />
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
};

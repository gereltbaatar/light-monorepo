"use client";

import { useState } from "react";
import { PiggyBank, CalendarClock } from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from "@workspace/ui/components/drawer";
import { NotchedCard, SHEET_GAP_CLASS } from "@workspace/sirius-core/components/NotchedCard";
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
            <DrawerContent className={`${SHEET_GAP_CLASS} mx-auto max-w-[406px] border-0 bg-transparent *:first:hidden`}>
                <NotchedCard closeLabel={t.close}>
                    <div className="w-full">
                        <div className="px-5 pb-4">
                            <DrawerTitle className="text-center text-xl font-bold tracking-tight text-foreground">
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
                </NotchedCard>
            </DrawerContent>
        </Drawer>
    );
};

"use client";

import { useState } from "react";
import { Repeat, Target } from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from "@workspace/ui/components/drawer";
import { NotchedCard, SHEET_GAP_CLASS } from "@workspace/sirius-core/components/NotchedCard";
import { useT } from "@/lib/i18n/client";
import { budgetsDict } from "@/lib/i18n/dictionaries/goals";
import { BudgetKindTab } from "./BudgetKindTab";
import { RecurringBudgetForm } from "./RecurringBudgetForm";
import { LimitBudgetForm } from "./LimitBudgetForm";

interface NewBudgetDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type BudgetKind = "recurring" | "limit";

export const NewBudgetDrawer = ({
    open,
    onOpenChange,
}: NewBudgetDrawerProps) => {
    const t = useT(budgetsDict);
    const [kind, setKind] = useState<BudgetKind>("recurring");

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);
        // Reset to default tab when the drawer closes so the next open starts fresh.
        if (!next) setKind("recurring");
    };

    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerContent className={`${SHEET_GAP_CLASS} mx-auto max-w-[406px] border-0 bg-transparent *:first:hidden`}>
                <NotchedCard closeLabel={t.close}>
                    <div className="w-full">
                        <div className="px-5 pb-4">
                            <DrawerTitle className="text-center text-xl font-bold tracking-tight text-foreground">
                                {t.addNewBudget}
                            </DrawerTitle>
                        </div>

                        <div className="px-4 pb-4">
                            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-2">
                                <BudgetKindTab
                                    active={kind === "recurring"}
                                    onClick={() => setKind("recurring")}
                                    icon={<Repeat className="w-4 h-4" strokeWidth={2.2} />}
                                    label={t.recurring}
                                    sublabel={t.recurringHint}
                                />
                                <BudgetKindTab
                                    active={kind === "limit"}
                                    onClick={() => setKind("limit")}
                                    icon={<Target className="w-4 h-4" strokeWidth={2.2} />}
                                    label={t.limit}
                                    sublabel={t.limitHint}
                                />
                            </div>
                        </div>

                        {kind === "recurring" ? (
                            <RecurringBudgetForm
                                onSubmitDone={() => onOpenChange(false)}
                            />
                        ) : (
                            <LimitBudgetForm
                                onSubmitDone={() => onOpenChange(false)}
                            />
                        )}
                    </div>
                </NotchedCard>
            </DrawerContent>
        </Drawer>
    );
};

"use client";

import { useRouter } from "next/navigation";
import { CalendarClock, ChevronLeft, PiggyBank } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@workspace/ui/components/tabs";
import { SavingsGoalForm } from "@/components/home/NewGoalDrawer/SavingsGoalForm";
import { ContributionGoalForm } from "@/components/home/NewGoalDrawer/ContributionGoalForm";
import { useT } from "@/lib/i18n/client";
import { goalsDict } from "@/lib/i18n/dictionaries/goals";

const KINDS = [
    { value: "savings", label: "savings", sublabel: "savingsHint", Icon: PiggyBank },
    { value: "plan", label: "plan", sublabel: "planHint", Icon: CalendarClock },
] as const;

export const NewGoalForm = () => {
    const t = useT(goalsDict);
    const router = useRouter();
    const handleCreated = (goalId?: string) =>
        router.replace(goalId ? `/goals/${goalId}` : "/");

    return (
        <>
            <div className="sticky top-0 z-40 flex items-center justify-center bg-background px-4 py-4">
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => router.back()}
                    className="absolute left-4 h-10 w-10 rounded-full"
                    aria-label={t.back}
                >
                    <ChevronLeft className="h-7 w-7 text-foreground" />
                </Button>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {t.newGoal}
                </h1>
            </div>

            <Tabs defaultValue="savings">
                <div className="px-4 pb-4">
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-surface-2 p-1">
                        {KINDS.map(({ value, label, sublabel, Icon }) => (
                            <TabsTrigger
                                key={value}
                                value={value}
                                className="flex flex-col items-start gap-1 rounded-xl px-4 py-3 text-left text-muted-foreground data-[state=active]:bg-background dark:data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                            >
                                <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                                    {t[label]}
                                </span>
                                <span className="text-xs font-normal text-muted-foreground">
                                    {t[sublabel]}
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="savings" className="mt-0">
                    <SavingsGoalForm onSubmitDone={handleCreated} />
                </TabsContent>
                <TabsContent value="plan" className="mt-0">
                    <ContributionGoalForm onSubmitDone={handleCreated} />
                </TabsContent>
            </Tabs>
        </>
    );
};

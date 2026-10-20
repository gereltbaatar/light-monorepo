"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
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

const KINDS = ["savings", "plan"] as const;
type Kind = (typeof KINDS)[number];

export const NewGoalForm = () => {
    const t = useT(goalsDict);
    const router = useRouter();
    const reduceMotion = useReducedMotion();
    const [kind, setKind] = useState<Kind>("savings");
    const direction = kind === "savings" ? -1 : 1;
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

            <Tabs value={kind} onValueChange={(value) => setKind(value as Kind)}>
                <div className="px-4 pb-4">
                    <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl border border-border bg-surface p-1">
                        {KINDS.map((value) => (
                            <TabsTrigger
                                key={value}
                                value={value}
                                className="relative h-full rounded-xl text-sm font-semibold tracking-tight transition-colors data-[state=active]:bg-transparent data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                            >
                                {kind === value && (
                                    <motion.span
                                        layoutId="goal-kind-pill"
                                        transition={
                                            reduceMotion
                                                ? { duration: 0 }
                                                : { type: "spring", stiffness: 420, damping: 34 }
                                        }
                                        className="absolute inset-0 rounded-xl bg-primary"
                                    />
                                )}
                                <span className="relative z-10">{t[value]}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value={kind} className="mt-0">
                    <motion.div
                        key={kind}
                        initial={reduceMotion ? false : { opacity: 0, x: direction * 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                    >
                        {kind === "savings" ? (
                            <SavingsGoalForm onSubmitDone={handleCreated} />
                        ) : (
                            <ContributionGoalForm onSubmitDone={handleCreated} />
                        )}
                    </motion.div>
                </TabsContent>
            </Tabs>
        </>
    );
};

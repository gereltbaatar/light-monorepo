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
import { RecurringBudgetForm } from "@/components/home/NewBudgetDrawer/RecurringBudgetForm";
import { LimitBudgetForm } from "@/components/home/NewBudgetDrawer/LimitBudgetForm";
import type { ExchangeRates } from "@/lib/exchange-rates";
import { useT } from "@/lib/i18n/client";
import { budgetsDict } from "@/lib/i18n/dictionaries/goals";

const KINDS = ["recurring", "limit"] as const;
type Kind = (typeof KINDS)[number];

export const NewBudgetForm = ({ rates }: { rates: ExchangeRates | null }) => {
    const t = useT(budgetsDict);
    const router = useRouter();
    const reduceMotion = useReducedMotion();
    const [kind, setKind] = useState<Kind>("recurring");
    const direction = kind === "recurring" ? -1 : 1;
    const handleCreated = () => router.replace("/");

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
                    {t.newBudget}
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
                                        layoutId="budget-kind-pill"
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
                        {kind === "recurring" ? (
                            <RecurringBudgetForm onSubmitDone={handleCreated} rates={rates} />
                        ) : (
                            <LimitBudgetForm onSubmitDone={handleCreated} rates={rates} />
                        )}
                    </motion.div>
                </TabsContent>
            </Tabs>
        </>
    );
};

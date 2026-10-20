"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import type { ExchangeRates } from "@/lib/exchange-rates";
import { createBudget, type CreateBudgetInput } from "@/app/_actions/budgets";
import { useT } from "@/lib/i18n/client";
import { toast } from "@/lib/toast";
import { categoriesDict } from "@/lib/i18n/dictionaries/categories";
import { budgetsDict } from "@/lib/i18n/dictionaries/goals";
import {
    labelClass,
    selectTriggerClass,
    submitButtonClass,
    type BudgetFormProps,
} from "./shared";
import { CurrencyAmountField } from "./CurrencyAmountField";
import { WarnAtField } from "./WarnAtField";

interface LimitBudgetFormProps extends BudgetFormProps {
    rates?: ExchangeRates | null;
}

export const LimitBudgetForm = ({ onSubmitDone, rates }: LimitBudgetFormProps) => {
    const t = useT(budgetsDict);
    const categories = useT(categoriesDict);
    const [isSaving, setIsSaving] = useState(false);

    const save = async (input: CreateBudgetInput) => {
        setIsSaving(true);
        try {
            const result = await createBudget(input);
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(t.budgetCreated);
            onSubmitDone();
        } catch {
            toast.error(t.errors.createFailed);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void save({
            kind: "limit",
            category: String(form.get("category")),
            amount: Number(form.get("limit_amount")),
            currency: String(form.get("currency") ?? "MNT"),
            period: String(form.get("period")) as CreateBudgetInput["period"],
            warningPercent: Number(form.get("warning_percent")),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="limit_category" className={labelClass}>
                    {t.category}
                </Label>
                <Select name="category" defaultValue="food">
                    <SelectTrigger id="limit_category" className={selectTriggerClass}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-60">
                        <SelectItem value="food">{categories.food}</SelectItem>
                        <SelectItem value="coffee">{categories.coffee}</SelectItem>
                        <SelectItem value="shopping">{categories.shopping}</SelectItem>
                        <SelectItem value="taxi">{categories.taxi}</SelectItem>
                        <SelectItem value="entertainment">{categories.entertainment}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="limit_amount" className={labelClass}>
                    {t.limitAmount}
                </Label>
                <CurrencyAmountField
                    id="limit_amount"
                    name="limit_amount"
                    placeholder="300000"
                    rates={rates}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="limit_period" className={labelClass}>
                        {t.period}
                    </Label>
                    <Select name="period" defaultValue="monthly">
                        <SelectTrigger id="limit_period" className={selectTriggerClass}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-60">
                            <SelectItem value="weekly">{t.periodOptions.weekly}</SelectItem>
                            <SelectItem value="monthly">{t.periodOptions.monthly}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="limit_warn" className={labelClass}>
                        {t.warnAt}
                    </Label>
                    <WarnAtField id="limit_warn" name="warning_percent" />
                </div>
            </div>

            <Button type="submit" disabled={isSaving} className={submitButtonClass}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.createBudget}
            </Button>
        </form>
    );
};

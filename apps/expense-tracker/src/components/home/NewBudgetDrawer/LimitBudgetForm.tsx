"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useT } from "@/lib/i18n/client";
import { categoriesDict } from "@/lib/i18n/dictionaries/categories";
import { budgetsDict } from "@/lib/i18n/dictionaries/goals";
import {
    inputClass,
    labelClass,
    selectClass,
    submitButtonClass,
    type BudgetFormProps,
} from "./shared";

export const LimitBudgetForm = ({ onSubmitDone }: BudgetFormProps) => {
    const t = useT(budgetsDict);
    const categories = useT(categoriesDict);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmitDone();
            }}
            className="px-4 pb-8 space-y-4"
        >
            <div className="space-y-2">
                <Label htmlFor="limit_category" className={labelClass}>
                    {t.category}
                </Label>
                <select
                    id="limit_category"
                    name="category"
                    defaultValue="food"
                    className={selectClass}
                >
                    <option value="food">{categories.food}</option>
                    <option value="coffee">{categories.coffee}</option>
                    <option value="shopping">{categories.shopping}</option>
                    <option value="taxi">{categories.taxi}</option>
                    <option value="entertainment">{categories.entertainment}</option>
                </select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="limit_amount" className={labelClass}>
                    {t.limitAmount}
                </Label>
                <Input
                    id="limit_amount"
                    name="limit_amount"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    placeholder="300000"
                    className={inputClass}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="limit_period" className={labelClass}>
                        {t.period}
                    </Label>
                    <select
                        id="limit_period"
                        name="period"
                        defaultValue="monthly"
                        className={selectClass}
                    >
                        <option value="weekly">{t.periodOptions.weekly}</option>
                        <option value="monthly">{t.periodOptions.monthly}</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="limit_warn" className={labelClass}>
                        {t.warnAt}
                    </Label>
                    <select
                        id="limit_warn"
                        name="warning_percent"
                        defaultValue="80"
                        className={selectClass}
                    >
                        <option value="80">80%</option>
                        <option value="100">100%</option>
                    </select>
                </div>
            </div>

            <Button type="submit" className={submitButtonClass}>
                {t.createBudget}
            </Button>
        </form>
    );
};

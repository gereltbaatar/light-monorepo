"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useT } from "@/lib/i18n/client";
import { budgetsDict } from "@/lib/i18n/dictionaries/goals";
import { ReminderRow } from "./ReminderRow";
import {
    inputClass,
    labelClass,
    selectClass,
    submitButtonClass,
    type BudgetFormProps,
} from "./shared";

export const RecurringBudgetForm = ({ onSubmitDone }: BudgetFormProps) => {
    const t = useT(budgetsDict);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmitDone();
            }}
            className="px-4 pb-8 space-y-4"
        >
            <div className="space-y-2">
                <Label htmlFor="recurring_title" className={labelClass}>
                    {t.name}
                </Label>
                <Input
                    id="recurring_title"
                    name="title"
                    type="text"
                    placeholder={t.namePlaceholder}
                    className={inputClass}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="recurring_amount" className={labelClass}>
                    {t.amount}
                </Label>
                <Input
                    id="recurring_amount"
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    placeholder="80000"
                    className={inputClass}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="recurring_repeat" className={labelClass}>
                        {t.repeats}
                    </Label>
                    <select
                        id="recurring_repeat"
                        name="repeat_type"
                        defaultValue="monthly"
                        className={selectClass}
                    >
                        <option value="weekly">{t.periodOptions.weekly}</option>
                        <option value="monthly">{t.periodOptions.monthly}</option>
                        <option value="yearly">{t.periodOptions.yearly}</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="recurring_due" className={labelClass}>
                        {t.dueDate}
                    </Label>
                    <Input
                        id="recurring_due"
                        name="due_date"
                        type="date"
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Reminders */}
            <div className="space-y-2">
                <Label className={labelClass}>{t.reminders}</Label>
                <div className="rounded-2xl bg-surface border border-border divide-y divide-border">
                    <ReminderRow id="remind_3d" label={t.remind3d} />
                    <ReminderRow id="remind_1d" label={t.remind1d} />
                </div>
            </div>

            {/* Auto-repeat */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
                <div>
                    <p className="text-sm font-semibold text-foreground tracking-tight">
                        {t.autoRepeat}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {t.autoRepeatHint}
                    </p>
                </div>
                <input
                    id="auto_repeat"
                    name="auto_repeat"
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 accent-foreground"
                />
            </div>

            <Button type="submit" className={submitButtonClass}>
                {t.createBudget}
            </Button>
        </form>
    );
};

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
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
import { SUBSCRIPTION_ICONS, type SubscriptionIconId } from "@/lib/subscription-icons";
import { budgetsDict } from "@/lib/i18n/dictionaries/goals";
import { DatePickerField } from "./DatePickerField";
import {
    inputClass,
    labelClass,
    selectTriggerClass,
    submitButtonClass,
    type BudgetFormProps,
} from "./shared";
import { CurrencyAmountField } from "./CurrencyAmountField";
import { SubscriptionIconPicker } from "./SubscriptionIconPicker";

const REMIND_DAYS = Array.from({ length: 10 }, (_, i) => i + 1);

interface RecurringBudgetFormProps extends BudgetFormProps {
    rates?: ExchangeRates | null;
}

export const RecurringBudgetForm = ({ onSubmitDone, rates }: RecurringBudgetFormProps) => {
    const t = useT(budgetsDict);
    const [icon, setIcon] = useState<SubscriptionIconId | null>(null);
    const [title, setTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Fills the name only while it is empty or still the previous platform's.
    const pickIcon = (next: SubscriptionIconId | null) => {
        const previousTitle = icon ? SUBSCRIPTION_ICONS[icon].title : "";
        if (next && (!title || title === previousTitle)) setTitle(SUBSCRIPTION_ICONS[next].title);
        setIcon(next);
    };

    const save = async (input: CreateBudgetInput) => {
        setIsSaving(true);
        try {
            const result = await createBudget(input);
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            if (result.taskFailed) toast.warning(t.taskFailed);
            else toast.success(t.budgetCreated);
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
            kind: "recurring",
            title,
            icon: icon ?? undefined,
            amount: Number(form.get("amount")),
            currency: String(form.get("currency") ?? "MNT"),
            period: String(form.get("repeat_type")) as CreateBudgetInput["period"],
            dueDate: String(form.get("due_date") ?? "") || undefined,
            remindDaysBefore: Number(form.get("remind_days_before") ?? 0),
            autoRepeat: form.get("auto_repeat") === "on",
            createTasks: form.get("create_tasks") === "on",
        });
    };

    return (
        <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-4">
            <div className="space-y-2">
                <Label className={labelClass}>{t.platform}</Label>
                <SubscriptionIconPicker name="icon" value={icon} onChange={pickIcon} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="recurring_title" className={labelClass}>
                    {t.name}
                </Label>
                <Input
                    id="recurring_title"
                    name="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className={inputClass}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="recurring_amount" className={labelClass}>
                    {t.amount}
                </Label>
                <CurrencyAmountField
                    id="recurring_amount"
                    name="amount"
                    placeholder="80000"
                    rates={rates}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="recurring_repeat" className={labelClass}>
                        {t.repeats}
                    </Label>
                    <Select name="repeat_type" defaultValue="monthly">
                        <SelectTrigger id="recurring_repeat" className={selectTriggerClass}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-60">
                            <SelectItem value="weekly">{t.periodOptions.weekly}</SelectItem>
                            <SelectItem value="monthly">{t.periodOptions.monthly}</SelectItem>
                            <SelectItem value="yearly">{t.periodOptions.yearly}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="recurring_due" className={labelClass}>
                        {t.dueDate}
                    </Label>
                    <DatePickerField id="recurring_due" name="due_date" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="recurring_remind" className={labelClass}>
                    {t.reminders}
                </Label>
                <Select name="remind_days_before" defaultValue="0">
                    <SelectTrigger id="recurring_remind" className={selectTriggerClass}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-60">
                        <SelectItem value="0">{t.noReminder}</SelectItem>
                        {REMIND_DAYS.map((days) => (
                            <SelectItem key={days} value={String(days)}>
                                {t.remindDaysBefore(days)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Auto-repeat */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
                <Label htmlFor="auto_repeat" className="cursor-pointer">
                    <span className="block text-sm font-semibold text-foreground tracking-tight">
                        {t.autoRepeat}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                        {t.autoRepeatHint}
                    </span>
                </Label>
                <Switch id="auto_repeat" name="auto_repeat" defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
                <Label htmlFor="create_tasks" className="cursor-pointer">
                    <span className="block text-sm font-semibold text-foreground tracking-tight">
                        {t.createTasks}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                        {t.createTasksHint}
                    </span>
                </Label>
                <Switch id="create_tasks" name="create_tasks" defaultChecked />
            </div>

            <Button type="submit" disabled={isSaving} className={submitButtonClass}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.createBudget}
            </Button>
        </form>
    );
};

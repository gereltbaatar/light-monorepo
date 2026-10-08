"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
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
import type { CreateGoalInput } from "@/app/_actions/goals";
import { useT } from "@/lib/i18n/client";
import { goalsDict } from "@/lib/i18n/dictionaries/goals";
import { GoalImagePicker } from "./GoalImagePicker";
import { GoalReminderRow } from "./GoalReminderRow";
import {
    inputClass,
    labelClass,
    numberOrUndefined,
    selectTriggerClass,
    stringOrUndefined,
    submitButtonClass,
    submitGoal,
    type GoalFormProps,
} from "./shared";

const todayInputValue = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

export const ContributionGoalForm = ({ onSubmitDone }: GoalFormProps) => {
    const t = useT(goalsDict);
    const [image, setImage] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);

        setIsSaving(true);
        try {
            const result = await submitGoal(
                {
                    kind: "plan",
                    title: String(form.get("title") ?? ""),
                    targetAmount: numberOrUndefined(form.get("target_amount")) ?? 0,
                    contributionAmount: numberOrUndefined(form.get("contribution_amount")),
                    contributionPeriod: (stringOrUndefined(
                        form.get("contribution_period")
                    ) ?? "monthly") as CreateGoalInput["contributionPeriod"],
                    startDate: stringOrUndefined(form.get("start_date")),
                    remindOnDue: form.get("goal_remind_contribution") === "on",
                    remindOnMilestone: form.get("goal_remind_milestone") === "on",
                    autoContribute: form.get("auto_contribute") === "on",
                },
                image
            );
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(t.goalCreated);
            onSubmitDone(result.id);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t.createFailed);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-4">
            <GoalImagePicker file={image} onChange={setImage} />

            <div className="space-y-2">
                <Label htmlFor="contribution_title" className={labelClass}>
                    {t.title}
                </Label>
                <Input
                    id="contribution_title"
                    name="title"
                    type="text"
                    required
                    placeholder={t.planTitlePlaceholder}
                    className={inputClass}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="contribution_target" className={labelClass}>
                    {t.targetAmount}
                </Label>
                <Input
                    id="contribution_target"
                    name="target_amount"
                    type="number"
                    inputMode="decimal"
                    min={1}
                    required
                    placeholder="3000000"
                    className={inputClass}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="contribution_amount" className={labelClass}>
                        {t.contribute}
                    </Label>
                    <Input
                        id="contribution_amount"
                        name="contribution_amount"
                        type="number"
                        inputMode="decimal"
                        min={1}
                        required
                        placeholder="200000"
                        className={inputClass}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="contribution_period" className={labelClass}>
                        {t.every}
                    </Label>
                    <Select name="contribution_period" defaultValue="monthly">
                        <SelectTrigger id="contribution_period" className={selectTriggerClass}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-60">
                            <SelectItem value="weekly">{t.periodOptions.weekly}</SelectItem>
                            <SelectItem value="monthly">{t.periodOptions.monthly}</SelectItem>
                            <SelectItem value="yearly">{t.periodOptions.yearly}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="contribution_start" className={labelClass}>
                    {t.startDate}
                </Label>
                <Input
                    id="contribution_start"
                    name="start_date"
                    type="date"
                    required
                    defaultValue={todayInputValue()}
                    className={inputClass}
                />
            </div>

            <div className="space-y-2">
                <Label className={labelClass}>{t.reminders}</Label>
                <div className="rounded-2xl bg-surface border border-border divide-y divide-border">
                    <GoalReminderRow
                        id="goal_remind_contribution"
                        label={t.remindDue}
                    />
                    <GoalReminderRow
                        id="goal_remind_milestone"
                        label={t.remindMilestone}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
                <Label htmlFor="auto_contribute" className="cursor-pointer">
                    <span className="block text-sm font-semibold text-foreground tracking-tight">
                        {t.autoContribute}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                        {t.autoContributeHint}
                    </span>
                </Label>
                <Switch id="auto_contribute" name="auto_contribute" defaultChecked />
            </div>

            <Button type="submit" disabled={isSaving} className={submitButtonClass}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.createGoal}
            </Button>
        </form>
    );
};

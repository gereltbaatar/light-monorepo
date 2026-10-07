"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
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

export const SavingsGoalForm = ({ onSubmitDone }: GoalFormProps) => {
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
                    kind: "savings",
                    title: String(form.get("title") ?? ""),
                    targetAmount: numberOrUndefined(form.get("target_amount")) ?? 0,
                    initialAmount: numberOrUndefined(form.get("initial_amount")),
                    targetDate: stringOrUndefined(form.get("target_date")),
                    category: (stringOrUndefined(form.get("category")) ??
                        "general") as CreateGoalInput["category"],
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
                <Label htmlFor="savings_title" className={labelClass}>
                    {t.title}
                </Label>
                <Input
                    id="savings_title"
                    name="title"
                    type="text"
                    required
                    placeholder={t.savingsTitlePlaceholder}
                    className={inputClass}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="savings_target" className={labelClass}>
                    {t.targetAmount}
                </Label>
                <Input
                    id="savings_target"
                    name="target_amount"
                    type="number"
                    inputMode="decimal"
                    min={1}
                    required
                    placeholder="1000000"
                    className={inputClass}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="savings_saved" className={labelClass}>
                        {t.alreadySaved}
                    </Label>
                    <Input
                        id="savings_saved"
                        name="initial_amount"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        placeholder="0"
                        className={inputClass}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="savings_date" className={labelClass}>
                        {t.targetDate}
                    </Label>
                    <Input
                        id="savings_date"
                        name="target_date"
                        type="date"
                        className={inputClass}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="savings_category" className={labelClass}>
                    {t.category}
                </Label>
                <Select name="category" defaultValue="general">
                    <SelectTrigger id="savings_category" className={selectTriggerClass}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-60">
                        <SelectItem value="general">{t.categories.general}</SelectItem>
                        <SelectItem value="travel">{t.categories.travel}</SelectItem>
                        <SelectItem value="gadget">{t.categories.gadget}</SelectItem>
                        <SelectItem value="home">{t.categories.home}</SelectItem>
                        <SelectItem value="emergency">{t.categories.emergency}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button type="submit" disabled={isSaving} className={submitButtonClass}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.createGoal}
            </Button>
        </form>
    );
};

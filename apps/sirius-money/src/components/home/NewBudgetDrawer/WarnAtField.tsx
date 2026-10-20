"use client";

import { useState } from "react";
import { Input } from "@workspace/ui/components/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import { useT } from "@/lib/i18n/client";
import { budgetsDict } from "@/lib/i18n/dictionaries/goals";
import { inputClass, selectTriggerClass } from "./shared";

const PRESETS = ["70", "80", "90", "100"];
const CUSTOM = "custom";

interface WarnAtFieldProps {
    id: string;
    name: string;
}

export const WarnAtField = ({ id, name }: WarnAtFieldProps) => {
    const t = useT(budgetsDict);
    const [choice, setChoice] = useState("80");
    const [custom, setCustom] = useState("");
    const isCustom = choice === CUSTOM;

    return (
        <>
            <Select value={choice} onValueChange={setChoice}>
                <SelectTrigger id={id} className={selectTriggerClass}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-60">
                    {PRESETS.map((percent) => (
                        <SelectItem key={percent} value={percent}>
                            {percent}%
                        </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM}>{t.customPercent}</SelectItem>
                </SelectContent>
            </Select>

            {isCustom && (
                <div className="relative">
                    <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={100}
                        required
                        autoFocus
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                        placeholder="75"
                        aria-label={t.customPercent}
                        className={`${inputClass} pr-9`}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                    </span>
                </div>
            )}

            <input type="hidden" name={name} value={isCustom ? custom : choice} />
        </>
    );
};

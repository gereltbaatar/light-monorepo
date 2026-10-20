"use client";

import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import {
    SUBSCRIPTION_ICONS,
    SUBSCRIPTION_ICON_IDS,
    type SubscriptionIconId,
} from "@/lib/subscription-icons";

interface SubscriptionIconPickerProps {
    name: string;
    value: SubscriptionIconId | null;
    onChange: (value: SubscriptionIconId | null) => void;
}

// Tapping the selected icon again clears it.
export const SubscriptionIconPicker = ({ name, value, onChange }: SubscriptionIconPickerProps) => (
    <>
        <ToggleGroup
            type="single"
            value={value ?? ""}
            onValueChange={(next) => onChange((next || null) as SubscriptionIconId | null)}
            className="-mx-4 justify-start gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide"
        >
            {SUBSCRIPTION_ICON_IDS.map((id) => (
                <ToggleGroupItem
                    key={id}
                    value={id}
                    aria-label={SUBSCRIPTION_ICONS[id].title}
                    title={SUBSCRIPTION_ICONS[id].title}
                    className="h-12 w-12 shrink-0 rounded-2xl border border-border bg-surface p-0 text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                    <SubscriptionIcon id={id} className="h-5 w-5" />
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
        <input type="hidden" name={name} value={value ?? ""} />
    </>
);

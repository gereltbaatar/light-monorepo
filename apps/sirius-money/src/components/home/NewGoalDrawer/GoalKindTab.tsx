"use client";

import { cn } from "@/lib/utils";

interface GoalKindTabProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    sublabel: string;
}

export const GoalKindTab = ({
    active,
    onClick,
    icon,
    label,
    sublabel,
}: GoalKindTabProps) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            "flex flex-col items-start gap-1 px-4 py-3 rounded-xl transition-colors text-left",
            active ? "bg-background shadow-sm dark:bg-surface" : "bg-transparent hover:bg-background/60"
        )}
    >
        <div className="flex items-center gap-2">
            <span className={active ? "text-foreground" : "text-muted-foreground"}>
                {icon}
            </span>
            <span
                className={cn(
                    "text-sm font-semibold tracking-tight",
                    active ? "text-foreground" : "text-muted-foreground"
                )}
            >
                {label}
            </span>
        </div>
        <span className="text-xs text-muted-foreground">{sublabel}</span>
    </button>
);

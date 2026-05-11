"use client";

import { useState } from "react";
import { Repeat, Target } from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from "@workspace/ui/components/drawer";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@/lib/utils";

interface NewBudgetDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type BudgetKind = "recurring" | "limit";

const inputClass =
    "h-12 px-4 rounded-2xl bg-[#F8F9FA] text-[#090909] placeholder:text-gray-400 border-gray-200";
const selectClass =
    "h-12 w-full px-4 rounded-2xl bg-[#F8F9FA] text-[#090909] border border-gray-200 outline-none";
const labelClass = "text-sm text-[#8E8E93]";

export const NewBudgetDrawer = ({
    open,
    onOpenChange,
}: NewBudgetDrawerProps) => {
    const [kind, setKind] = useState<BudgetKind>("recurring");

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);
        // Reset to default tab when the drawer closes so the next open starts fresh.
        if (!next) setKind("recurring");
    };

    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerContent className="bg-white border-0 rounded-t-[28px] *:first:hidden">
                <div className="mx-auto w-full max-w-[430px]">
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="h-1 w-10 rounded-full bg-[#E5E5EA]" />
                    </div>

                    <div className="px-5 pt-4 pb-4">
                        <DrawerTitle className="text-2xl font-bold text-[#1C1C1E] tracking-tight">
                            Add new budget
                        </DrawerTitle>
                    </div>

                    {/* Kind tabs */}
                    <div className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#F1F3F5]">
                            <BudgetKindTab
                                active={kind === "recurring"}
                                onClick={() => setKind("recurring")}
                                icon={<Repeat className="w-4 h-4" strokeWidth={2.2} />}
                                label="Recurring"
                                sublabel="Fixed bills"
                            />
                            <BudgetKindTab
                                active={kind === "limit"}
                                onClick={() => setKind("limit")}
                                icon={<Target className="w-4 h-4" strokeWidth={2.2} />}
                                label="Limit"
                                sublabel="Spending cap"
                            />
                        </div>
                    </div>

                    {kind === "recurring" ? (
                        <RecurringBudgetForm onSubmitDone={() => onOpenChange(false)} />
                    ) : (
                        <LimitBudgetForm onSubmitDone={() => onOpenChange(false)} />
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
};

// -- Kind tab button -------------------------------------------------------

interface BudgetKindTabProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    sublabel: string;
}

const BudgetKindTab = ({
    active,
    onClick,
    icon,
    label,
    sublabel,
}: BudgetKindTabProps) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            "flex flex-col items-start gap-1 px-4 py-3 rounded-xl transition-colors text-left",
            active
                ? "bg-white shadow-sm"
                : "bg-transparent hover:bg-white/60"
        )}
    >
        <div className="flex items-center gap-2">
            <span className={active ? "text-[#1C1C1E]" : "text-[#8E8E93]"}>
                {icon}
            </span>
            <span
                className={cn(
                    "text-sm font-semibold tracking-tight",
                    active ? "text-[#1C1C1E]" : "text-[#8E8E93]"
                )}
            >
                {label}
            </span>
        </div>
        <span className="text-xs text-[#8E8E93]">{sublabel}</span>
    </button>
);

// -- Recurring (fixed bills) form -----------------------------------------

interface FormProps {
    onSubmitDone: () => void;
}

const RecurringBudgetForm = ({ onSubmitDone }: FormProps) => {
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
                    Name
                </Label>
                <Input
                    id="recurring_title"
                    name="title"
                    type="text"
                    placeholder="Tog, Internet, Netflix…"
                    className={inputClass}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="recurring_amount" className={labelClass}>
                    Amount
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
                        Repeats
                    </Label>
                    <select
                        id="recurring_repeat"
                        name="repeat_type"
                        defaultValue="monthly"
                        className={selectClass}
                    >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="recurring_due" className={labelClass}>
                        Due date
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
                <Label className={labelClass}>Reminders</Label>
                <div className="rounded-2xl bg-[#F8F9FA] border border-gray-200 divide-y divide-gray-200">
                    <ReminderRow id="remind_3d" label="3 days before" />
                    <ReminderRow id="remind_1d" label="1 day before" />
                </div>
            </div>

            {/* Auto-repeat */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8F9FA] border border-gray-200">
                <div>
                    <p className="text-sm font-semibold text-[#1C1C1E] tracking-tight">
                        Auto-repeat
                    </p>
                    <p className="text-xs text-[#8E8E93]">
                        Recreate the bill each period
                    </p>
                </div>
                <input
                    id="auto_repeat"
                    name="auto_repeat"
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 accent-[#090909]"
                />
            </div>

            <Button
                type="submit"
                className="w-full rounded-full py-6 text-base font-semibold bg-[#090909] text-white hover:bg-[#1C1C1E]"
            >
                Create budget
            </Button>
        </form>
    );
};

// -- Limit (spending cap) form --------------------------------------------

const LimitBudgetForm = ({ onSubmitDone }: FormProps) => {
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
                    Category
                </Label>
                <select
                    id="limit_category"
                    name="category"
                    defaultValue="food"
                    className={selectClass}
                >
                    <option value="food">Food</option>
                    <option value="coffee">Coffee</option>
                    <option value="shopping">Shopping</option>
                    <option value="taxi">Taxi</option>
                    <option value="entertainment">Entertainment</option>
                </select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="limit_amount" className={labelClass}>
                    Limit
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
                        Period
                    </Label>
                    <select
                        id="limit_period"
                        name="period"
                        defaultValue="monthly"
                        className={selectClass}
                    >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="limit_warn" className={labelClass}>
                        Warn at
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

            <Button
                type="submit"
                className="w-full rounded-full py-6 text-base font-semibold bg-[#090909] text-white hover:bg-[#1C1C1E]"
            >
                Create budget
            </Button>
        </form>
    );
};

// -- Shared reminder row ---------------------------------------------------

interface ReminderRowProps {
    id: string;
    label: string;
}

const ReminderRow = ({ id, label }: ReminderRowProps) => (
    <label
        htmlFor={id}
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
    >
        <span className="text-sm text-[#1C1C1E]">{label}</span>
        <input
            id={id}
            name={id}
            type="checkbox"
            className="h-5 w-5 accent-[#090909]"
        />
    </label>
);

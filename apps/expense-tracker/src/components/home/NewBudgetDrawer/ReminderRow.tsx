"use client";

interface ReminderRowProps {
    id: string;
    label: string;
}

export const ReminderRow = ({ id, label }: ReminderRowProps) => (
    <label
        htmlFor={id}
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
    >
        <span className="text-sm text-foreground">{label}</span>
        <input
            id={id}
            name={id}
            type="checkbox"
            className="h-5 w-5 accent-foreground"
        />
    </label>
);

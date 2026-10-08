import {
    Car,
    Clapperboard,
    Coffee,
    Gift,
    HeartPulse,
    Receipt,
    ShoppingBag,
    Utensils,
    Wallet,
    type LucideIcon,
} from "lucide-react";

export const CATEGORY_KEYS = [
    "food",
    "coffee",
    "shopping",
    "taxi",
    "entertainment",
    "bills",
    "health",
    "salary",
    "gift",
    "other",
] as const;

export type Category = (typeof CATEGORY_KEYS)[number];

// Salary and gift are income-only, so receipts never pick them.
export const EXPENSE_CATEGORY_KEYS: Category[] = [
    "food",
    "coffee",
    "shopping",
    "taxi",
    "entertainment",
    "bills",
    "health",
    "other",
];

export const CATEGORIES: Record<Category, { label: string; icon?: LucideIcon }> = {
    food: { label: "Food", icon: Utensils },
    coffee: { label: "Coffee", icon: Coffee },
    shopping: { label: "Shopping", icon: ShoppingBag },
    taxi: { label: "Taxi", icon: Car },
    entertainment: { label: "Entertainment", icon: Clapperboard },
    bills: { label: "Bills", icon: Receipt },
    health: { label: "Health", icon: HeartPulse },
    salary: { label: "Salary", icon: Wallet },
    gift: { label: "Gift", icon: Gift },
    other: { label: "Other" },
};

export const INCOME_CATEGORY_KEYS: Category[] = ["salary", "gift", "other"];

export const categoryImage = (key: Category) => `/categories/${key}.png`;

export function toCategory(raw: unknown): Category {
    return CATEGORY_KEYS.includes(raw as Category) ? (raw as Category) : "other";
}

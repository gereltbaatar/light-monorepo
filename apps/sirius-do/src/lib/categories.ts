import {
  BookOpen,
  Briefcase,
  Car,
  Carrot,
  Code,
  Coffee,
  Droplet,
  Dumbbell,
  Gift,
  HeartPulse,
  House,
  Music,
  PawPrint,
  Phone,
  Plane,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Category } from "@/lib/types";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  user: User,
  "heart-pulse": HeartPulse,
  dumbbell: Dumbbell,
  "book-open": BookOpen,
  house: House,
  "shopping-cart": ShoppingCart,
  wallet: Wallet,
  droplet: Droplet,
  carrot: Carrot,
  coffee: Coffee,
  plane: Plane,
  music: Music,
  code: Code,
  phone: Phone,
  car: Car,
  gift: Gift,
  "paw-print": PawPrint,
  sparkles: Sparkles,
  star: Star,
  tag: Tag,
};

export const CATEGORY_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#ef4444", "#a855f7", "#14b8a6", "#eab308", "#ec4899", "#64748b"];

export type DefaultCategoryKey = keyof Dictionary["categories"]["defaults"];

export const DEFAULT_CATEGORIES: { key: DefaultCategoryKey; icon: string; color: string }[] = [
  { key: "work", icon: "briefcase", color: "#3b82f6" },
  { key: "personal", icon: "user", color: "#a855f7" },
  { key: "health", icon: "heart-pulse", color: "#ef4444" },
  { key: "fitness", icon: "dumbbell", color: "#f97316" },
  { key: "study", icon: "book-open", color: "#14b8a6" },
  { key: "home", icon: "house", color: "#eab308" },
  { key: "shopping", icon: "shopping-cart", color: "#ec4899" },
  { key: "finance", icon: "wallet", color: "#22c55e" },
];

export function categoryName(category: Category, t: Dictionary): string {
  const defaults: Record<string, string> = t.categories.defaults;
  return (category.key && defaults[category.key]) || category.name || "";
}

import { BadgeCheck, Flame, Leaf, Zap, type LucideIcon } from "lucide-react";
import type { Task } from "@/lib/types";

export const PRIORITY_COLOR: Record<Task["priority"], string> = {
  low: "#2dd4bf",
  medium: "var(--domain-do)",
  high: "var(--domain-fit)",
  urgent: "#f43f5e",
};

export const PRIORITY_ICON: Record<Task["priority"], LucideIcon> = {
  low: Leaf,
  medium: BadgeCheck,
  high: Flame,
  urgent: Zap,
};

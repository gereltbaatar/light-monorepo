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
import { DICTIONARIES, type Dictionary } from "@/lib/i18n/dictionary";
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

// Matched as word prefixes; Latin spellings cover Mongolian typed without a Cyrillic keyboard.
const KEYWORDS: Record<DefaultCategoryKey, string[]> = {
  work: [
    "meeting", "report", "deploy", "client", "email",
    "ажил", "уулзалт", "хурал", "тайлан", "имэйл",
    "ajil", "uulzalt", "hural", "khural", "tailan", "imeil",
  ],
  personal: [
    "birthday", "mom", "dad", "family", "friend",
    "төрсөн", "ээж", "аав", "найз", "гэр бүл",
    "tursun", "torson", "eej", "aav", "naiz", "ger bul",
  ],
  health: [
    "dentist", "doctor", "hospital", "clinic", "pharmacy", "medicine",
    "эмч", "шүд", "эмнэлэг", "эм ",
    "emch", "shud", "shüd", "emneleg", "em ",
  ],
  fitness: [
    "gym", "workout", "run", "yoga", "swim",
    "тамир", "гүйлт", "гүйх", "фитнес", "йога", "бассейн", "жим", "гэм",
    "tamir", "guilt", "guih", "fitness", "basein", "jim", "gem",
  ],
  study: [
    "study", "class", "lecture", "exam", "homework", "read",
    "хичээл", "шалгалт", "унших", "даалгавар", "ном",
    "hicheel", "khicheel", "shalgalt", "unshih", "unshikh", "daalgavar", "nom ",
  ],
  home: [
    "clean", "laundry", "cook", "dishes", "vacuum",
    "цэвэрлэ", "угаа", "хоол хий",
    "tseverle", "ugaa", "hool hii",
  ],
  shopping: [
    "buy", "shop", "groceries", "market",
    "худалд", "дэлгүүр", "зах",
    "hudald", "delguur", "zah ",
  ],
  finance: [
    "pay", "bill", "bank", "rent", "tax", "loan",
    "төл", "банк", "түрээс", "татвар", "зээл",
    "tolbor", "tulbur", "tuluh", "toloh", "turees", "tatvar", "zeel",
  ],
};

function names(category: Category): string[] {
  const all = category.key ? Object.values(DICTIONARIES).map((d) => categoryName(category, d)) : [category.name ?? ""];
  return all.map((n) => n.toLowerCase().replace(/\s+/g, "")).filter(Boolean);
}

// A #tag wins over keywords and is stripped from the title.
export function detectCategory(title: string, categories: Category[]): { categoryId: string | null; title: string } {
  const tag = title.match(/(?:^|\s)#([^\s#]+)/u);
  if (tag) {
    const wanted = tag[1]!.toLowerCase();
    const match = categories.find((c) => names(c).some((n) => n.startsWith(wanted)));
    if (match) return { categoryId: match.id, title: title.replace(tag[0], " ").replace(/\s+/g, " ").trim() };
  }

  const lower = ` ${title.toLowerCase()} `;
  const byName = categories.find((c) => names(c).some((n) => n.length > 2 && lower.includes(` ${n}`)));
  if (byName) return { categoryId: byName.id, title };

  const hits = (c: Category) => (c.key ? (KEYWORDS[c.key as DefaultCategoryKey] ?? []).filter((k) => lower.includes(` ${k}`)).length : 0);
  const best = categories.reduce<Category | null>((top, c) => (hits(c) > (top ? hits(top) : 0) ? c : top), null);
  return { categoryId: best?.id ?? null, title };
}

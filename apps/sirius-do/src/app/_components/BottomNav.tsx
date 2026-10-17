"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, ListTodo, Plus, Sun, Tags, type LucideIcon } from "lucide-react";
import type { Day } from "@workspace/sirius-core/lib/date";
import { useI18n } from "@/lib/i18n/client";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LinkPending } from "./LinkPending";
import { VoiceButton } from "./VoiceButton";

const PAGES: { href: string; label: "today" | "tasks" | "categories" | "calendar"; icon: LucideIcon }[] = [
  { href: "/", label: "today", icon: Sun },
  { href: "/tasks", label: "tasks", icon: ListTodo },
  { href: "/categories", label: "categories", icon: Tags },
  { href: "/calendar", label: "calendar", icon: CalendarDays },
];

interface BottomNavProps {
  today: Day;
  categories: Category[];
}

export function BottomNav({ today, categories }: BottomNavProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const params = useSearchParams();
  const day = params.get("day");
  const addParams = new URLSearchParams({ day: day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : today });
  const cat = categories.find((c) => c.id === params.get("cat"))?.id;
  if (cat) addParams.set("cat", cat);
  if (pathname === "/add-task") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto flex w-full max-w-[430px] items-center justify-between gap-3">
        <nav className="flex h-18 items-center gap-2.5 rounded-full bg-[#1C1C1E] px-2 py-2 dark:ring-1 dark:ring-border">
          {PAGES.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={t.nav[label]}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative grid size-[52px] place-items-center rounded-full transition-colors duration-300",
                  active ? "bg-white text-[#1C1C1E]" : "text-gray-400"
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                <LinkPending className="absolute -top-0.5 -right-0.5 size-4" />
              </Link>
            );
          })}
        </nav>

        <div className="relative">
          <div className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2">
            <VoiceButton categories={categories} />
          </div>
          <Link
            href={`/add-task?${addParams}`}
            aria-label={t.nav.create}
            className="grid size-18 place-items-center rounded-full bg-[#1C1C1E] text-white shadow-lg transition-transform active:scale-95 dark:ring-1 dark:ring-border"
          >
            <Plus className="size-7" strokeWidth={2.2} />
          </Link>
        </div>
      </div>

    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { CalendarCheck2, LayoutGrid } from "lucide-react";
import type { Day } from "@workspace/sirius-core/lib/date";
import { CategoryIcon } from "@/app/_components/CategoryIcon";
import { TaskCard } from "@/app/_components/TaskCard";
import { categoryName } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/locale";
import type { Category, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function ProgressRing({ rate }: { rate: number }) {
  const c = 2 * Math.PI * 13;
  return (
    <svg viewBox="0 0 32 32" className="absolute inset-0 -rotate-90" aria-hidden>
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeOpacity={0.3} strokeWidth="2.5" />
      <circle
        cx="16"
        cy="16"
        r="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - rate)}
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}

const CHIP =
  "flex h-11 shrink-0 items-center gap-2 rounded-full bg-zinc-200 py-1 pl-1 pr-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=true]:bg-foreground aria-[current=true]:text-background dark:bg-zinc-900 dark:aria-[current=true]:bg-foreground";

const BUBBLE = "grid size-9 place-items-center rounded-full bg-background";

interface DayBoardProps {
  days: Day[];
  today: Day;
  weekTasks: Task[];
  undated: Task[];
  categories: Category[];
}

// The week is already loaded, so switching day or category is a client-side filter.
export function DayBoard({ days, today, weekTasks, undated, categories }: DayBoardProps) {
  const { locale, t } = useI18n();
  const params = useSearchParams();
  const dayParam = params.get("day");
  const selected = dayParam && DAY_PATTERN.test(dayParam) && days.includes(dayParam) ? dayParam : days.includes(today) ? today : days[0]!;
  const active = categories.find((c) => c.id === params.get("cat"))?.id;

  const select = (day: Day, category: string | undefined) => {
    const next = new URLSearchParams(params.toString());
    next.set("day", day);
    if (category) next.set("cat", category);
    else next.delete("cat");
    window.history.pushState(null, "", `?${next}`);
  };

  const byId = new Map(categories.map((c) => [c.id, c]));
  const inCategory = (task: Task) => !active || task.category_id === active;
  const dayTasks = weekTasks.filter((task) => task.due_date === selected && inCategory(task));
  const doneCount = dayTasks.filter((task) => task.status === "done").length;
  const rate = dayTasks.length ? doneCount / dayTasks.length : 0;
  const cards = [
    ...dayTasks.filter((task) => task.status !== "done"),
    ...(selected === today ? undated.filter(inCategory) : []),
    ...dayTasks.filter((task) => task.status === "done"),
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-center text-base font-semibold">
        {selected === today ? t.today.title : formatDate(selected, { weekday: "long", month: "long", day: "numeric" }, locale)}
      </h2>

      <nav className="grid grid-cols-7 gap-1 text-center">
        {days.map((day) => {
          const current = day === selected;
          return (
            <button
              key={day}
              type="button"
              onClick={() => select(day, active)}
              aria-current={current ? "date" : undefined}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl py-2.5 text-xs transition-colors active:scale-95",
                current ? "bg-foreground text-background" : "bg-muted text-gray-800 hover:bg-muted/70 dark:text-gray-100",
              )}
            >
              <span className="font-medium">{formatDate(day, { weekday: "short" }, locale)}</span>
              <span
                className={cn(
                  "relative grid size-8 place-items-center font-mono text-sm tabular-nums",
                  !current && day === today && "font-semibold text-app",
                )}
              >
                {current && <ProgressRing rate={rate} />}
                {formatDate(day, { day: "numeric" }, locale)}
              </span>
            </button>
          );
        })}
      </nav>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:px-0">
        <button type="button" onClick={() => select(selected, undefined)} aria-current={!active} className={CHIP}>
          <span className={BUBBLE}>
            <LayoutGrid className="size-4.5 text-muted-foreground" />
          </span>
          {t.categories.all}
        </button>
        {categories.map((c) => (
          <button key={c.id} type="button" onClick={() => select(selected, c.id)} aria-current={c.id === active} className={CHIP}>
            <span className={BUBBLE}>
              <CategoryIcon icon={c.icon} shaded className="size-4.5" />
            </span>
            {categoryName(c, t)}
          </button>
        ))}
      </nav>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-12 text-center animate-in fade-in duration-200">
          <span className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <CalendarCheck2 className="size-7" strokeWidth={1.75} />
          </span>
          <p className="mt-4 font-medium">{t.tasks.emptyDay}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.tasks.emptyDayHint}</p>
        </div>
      ) : (
        <ul key={`${selected}-${active ?? ""}`} className="space-y-2.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
          {cards.map((task) => (
            <TaskCard key={task.id} task={task} category={task.category_id ? byId.get(task.category_id) : undefined} />
          ))}
        </ul>
      )}
    </div>
  );
}

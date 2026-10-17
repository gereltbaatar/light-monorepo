"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlarmClock,
  CalendarRange,
  ChevronRight,
  CircleCheckBig,
  Inbox,
  LayoutGrid,
  Loader2,
  Plus,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { addDays, type Day } from "@workspace/sirius-core/lib/date";
import { moveTasks } from "@/app/_actions/tasks";
import { CategoryIcon } from "@/app/_components/CategoryIcon";
import { TaskRow } from "@/app/(main)/tasks/_components/TaskRow";
import { TASK_VIEWS, isTaskView, type TaskView } from "@/app/(main)/tasks/views";
import { categoryName } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { formatDate } from "@/lib/locale";
import type { Category, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const VIEW_STYLE: Record<TaskView, { icon: LucideIcon; color: string }> = {
  all: { icon: Inbox, color: "var(--domain-do)" },
  today: { icon: Sun, color: "#f59e0b" },
  upcoming: { icon: CalendarRange, color: "#a855f7" },
  overdue: { icon: AlarmClock, color: "#ef4444" },
  done: { icon: CircleCheckBig, color: "#22c55e" },
};

interface Section {
  key: string;
  title: string;
  tasks: Task[];
  danger?: boolean;
  hideDate?: boolean;
  moveAll?: boolean;
}

function dayIn(timestamp: string, timezone: string): Day {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date(timestamp));
}

function viewLabel(view: TaskView, t: Dictionary): string {
  return view === "today" ? t.today.title : t.tasks[view];
}

function sectionsFor(view: TaskView, open: Task[], done: Task[], today: Day, timezone: string, t: Dictionary, locale: Locale): Section[] {
  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, 7);
  const overdue = open.filter((task) => task.due_date && task.due_date < today);
  const dueToday = open.filter((task) => task.due_date === today);

  if (view === "done") {
    const yesterday = addDays(today, -1);
    const doneDay = (task: Task) => (task.completed_at ? dayIn(task.completed_at, timezone) : "");
    return [
      { key: "today", title: t.today.title, tasks: done.filter((task) => doneDay(task) === today) },
      { key: "yesterday", title: t.tasks.yesterday, tasks: done.filter((task) => doneDay(task) === yesterday) },
      { key: "earlier", title: t.tasks.earlier, tasks: done.filter((task) => doneDay(task) < yesterday) },
    ];
  }
  if (view === "overdue") return [{ key: "overdue", title: t.tasks.overdue, tasks: overdue, danger: true, moveAll: true }];
  if (view === "today") {
    return [
      { key: "overdue", title: t.tasks.overdue, tasks: overdue, danger: true, moveAll: true },
      { key: "today", title: t.today.title, tasks: dueToday, hideDate: true },
    ];
  }
  if (view === "upcoming") {
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1));
    return [
      ...days.map((day) => ({
        key: day,
        title: day === tomorrow ? t.quickAdd.tomorrow : formatDate(day, { weekday: "long", month: "short", day: "numeric" }, locale),
        tasks: open.filter((task) => task.due_date === day),
        hideDate: true,
      })),
      { key: "later", title: t.tasks.later, tasks: open.filter((task) => task.due_date && task.due_date > weekEnd) },
    ];
  }
  return [
    { key: "overdue", title: t.tasks.overdue, tasks: overdue, danger: true, moveAll: true },
    { key: "today", title: t.today.title, tasks: dueToday, hideDate: true },
    { key: "tomorrow", title: t.tasks.tomorrow, tasks: open.filter((task) => task.due_date === tomorrow), hideDate: true },
    {
      key: "nextWeek",
      title: t.tasks.nextWeek,
      tasks: open.filter((task) => task.due_date && task.due_date > tomorrow && task.due_date <= weekEnd),
    },
    { key: "later", title: t.tasks.later, tasks: open.filter((task) => task.due_date && task.due_date > weekEnd) },
    { key: "noDate", title: t.tasks.noDate, tasks: open.filter((task) => !task.due_date) },
  ];
}

const EMPTY: Record<TaskView, (t: Dictionary) => [string, string]> = {
  all: (t) => [t.tasks.emptyAll, t.tasks.emptyAllHint],
  today: (t) => [t.tasks.emptyToday, t.tasks.emptyTodayHint],
  upcoming: (t) => [t.tasks.emptyUpcoming, t.tasks.emptyAllHint],
  overdue: (t) => [t.tasks.emptyOverdue, t.tasks.emptyOverdueHint],
  done: (t) => [t.tasks.emptyDone, t.tasks.emptyDoneHint],
};

const CHIP =
  "flex h-10 shrink-0 items-center gap-2 rounded-full bg-zinc-200 py-1 pl-1 pr-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=true]:bg-foreground aria-[current=true]:text-background dark:bg-zinc-900 dark:aria-[current=true]:bg-foreground";

function MoveAllButton({ ids, today, label }: { ids: string[]; today: Day; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => moveTasks(ids, today))}
      className="absolute top-0 right-1 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-app transition-colors hover:bg-app/10 disabled:opacity-60"
    >
      {pending && <Loader2 className="size-3 animate-spin" />}
      {label}
    </button>
  );
}

interface TasksBoardProps {
  today: Day;
  timezone: string;
  open: Task[];
  done: Task[];
  categories: Category[];
}

// All open and recent done tasks are loaded, so views and category filters switch client-side.
export function TasksBoard({ today, timezone, open, done, categories }: TasksBoardProps) {
  const { locale, t } = useI18n();
  const params = useSearchParams();
  const requested = params.get("view") ?? (params.get("filter") === "done" ? "done" : null);
  const view: TaskView = isTaskView(requested) ? requested : "all";
  const byId = new Map(categories.map((c) => [c.id, c]));
  const active = categories.find((c) => c.id === params.get("cat"))?.id;

  const go = (nextView: TaskView, category: string | undefined) => {
    const next = new URLSearchParams();
    if (nextView !== "all") next.set("view", nextView);
    if (category) next.set("cat", category);
    window.history.pushState(null, "", next.size ? `?${next}` : window.location.pathname);
  };

  const inCategory = (task: Task) => !active || task.category_id === active;
  const overdueCount = open.filter((task) => task.due_date && task.due_date < today).length;
  const counts: Record<TaskView, number> = {
    all: open.length,
    today: open.filter((task) => task.due_date === today).length + overdueCount,
    upcoming: open.filter((task) => task.due_date && task.due_date > today).length,
    overdue: overdueCount,
    done: done.filter((task) => task.completed_at && dayIn(task.completed_at, timezone) === today).length,
  };

  const sections = sectionsFor(view, open.filter(inCategory), done.filter(inCategory), today, timezone, t, locale).filter(
    (section) => section.tasks.length > 0,
  );
  const [emptyTitle, emptyHint] = EMPTY[view](t);
  const EmptyIcon = VIEW_STYLE[view].icon;

  const addParams = new URLSearchParams({ day: today });
  if (active) addParams.set("cat", active);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{t.tasks.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t.tasks.openCount(open.length)}
            {overdueCount > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-expense">{t.tasks.overdueCount(overdueCount)}</span>
              </>
            )}
          </p>
        </div>
        <Link
          href={`/add-task?${addParams}`}
          aria-label={t.tasks.add}
          title={t.tasks.add}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-foreground text-background shadow-sm transition-transform hover:opacity-90 active:scale-95"
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </Link>
      </header>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
        {TASK_VIEWS.map((v) => {
          const { icon: Icon, color } = VIEW_STYLE[v];
          return (
            <button
              key={v}
              type="button"
              onClick={() => go(v, active)}
              aria-current={v === view ? "page" : undefined}
              className={cn(
                "flex w-32 shrink-0 flex-col gap-3 rounded-[22px] bg-card p-3.5 text-left transition-all active:scale-[0.97] sm:w-auto",
                v === view ? "ring-2 ring-foreground" : "hover:bg-muted",
              )}
            >
              <span className="flex items-center justify-between">
                <span
                  className="grid size-9 place-items-center rounded-full"
                  style={{ backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`, color }}
                >
                  <Icon className="size-4.5" strokeWidth={2.2} />
                </span>
                <span className={cn("font-mono text-xl font-bold tabular-nums", v === "overdue" && counts.overdue > 0 && "text-expense")}>
                  {counts[v]}
                </span>
              </span>
              <span className="truncate text-sm font-semibold text-muted-foreground">{viewLabel(v, t)}</span>
            </button>
          );
        })}
      </nav>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:px-0">
        <button type="button" onClick={() => go(view, undefined)} aria-current={!active} className={CHIP}>
          <span className="grid size-8 place-items-center rounded-full bg-background">
            <LayoutGrid className="size-4 text-muted-foreground" />
          </span>
          {t.categories.all}
        </button>
        {categories.map((c) => (
          <button key={c.id} type="button" onClick={() => go(view, c.id)} aria-current={c.id === active} className={CHIP}>
            <span className="grid size-8 place-items-center rounded-full bg-background">
              <CategoryIcon icon={c.icon} shaded className="size-4" />
            </span>
            {categoryName(c, t)}
          </button>
        ))}
      </nav>

      <div key={`${view}-${active ?? ""}`} className="space-y-5 animate-in fade-in slide-in-from-bottom-1 duration-200">
        {sections.length === 0 ? (
          <div className="flex flex-col items-center rounded-[28px] border border-dashed px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <EmptyIcon className="size-7" strokeWidth={1.75} />
            </span>
            <p className="mt-4 font-semibold">{emptyTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{emptyHint}</p>
          </div>
        ) : (
          sections.map((section) => (
            <div key={section.key} className="relative">
              <details open className="group/section">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-1 pb-2 [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-open/section:rotate-90" />
                  <h2 className={cn("text-sm font-bold", section.danger && "text-expense")}>{section.title}</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                    {section.tasks.length}
                  </span>
                </summary>
                <ul className="divide-y overflow-hidden rounded-[22px] bg-card">
                  {section.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      today={today}
                      category={task.category_id ? byId.get(task.category_id) : undefined}
                      hideDate={section.hideDate}
                    />
                  ))}
                </ul>
              </details>
              {section.moveAll && <MoveAllButton ids={section.tasks.map((task) => task.id)} today={today} label={t.tasks.moveAllToday} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

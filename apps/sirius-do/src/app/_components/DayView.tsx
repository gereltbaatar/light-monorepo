import Link from "next/link";
import { CalendarCheck2, LayoutGrid } from "lucide-react";
import {
  daysBetween,
  weekRange,
  type Day,
} from "@workspace/sirius-core/lib/date";
import { TaskCard } from "@/app/_components/TaskCard";
import { CategoryIcon } from "@/app/_components/CategoryIcon";
import { categoryName } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatDate } from "@/lib/locale";
import {
  getCategories,
  getOpenTasks,
  getTasksDue,
  progressOf,
} from "@/lib/tasks";
import type { Category } from "@/lib/types";

type DayHref = (day: Day, category?: string) => string;

function ProgressRing({ rate }: { rate: number }) {
  const c = 2 * Math.PI * 13;
  return (
    <svg
      viewBox="0 0 32 32"
      className="absolute inset-0 -rotate-90"
      aria-hidden
    >
      <circle
        cx="16"
        cy="16"
        r="13"
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.3}
        strokeWidth="2.5"
      />
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
      />
    </svg>
  );
}

interface DayStripProps {
  days: Day[];
  selected: Day;
  today: Day;
  rate: number;
  locale: Locale;
  href: DayHref;
  category?: string;
}

function DayStrip({
  days,
  selected,
  today,
  rate,
  locale,
  href,
  category,
}: DayStripProps) {
  return (
    <nav className="grid grid-cols-7 gap-1 text-center">
      {days.map((day) => {
        const active = day === selected;
        return (
          <Link
            key={day}
            href={href(day, category)}
            aria-current={active ? "date" : undefined}
            className={`flex flex-col items-center gap-2 rounded-xl py-2.5 text-xs transition-colors ${active ? "bg-foreground text-background" : "bg-muted text-gray-800 hover:bg-muted/70 dark:text-gray-100"}`}
          >
            <span className="font-medium">
              {formatDate(day, { weekday: "short" }, locale)}
            </span>
            <span
              className={`relative grid size-8 place-items-center font-mono text-sm tabular-nums ${!active && day === today ? "font-semibold text-app" : ""}`}
            >
              {active && <ProgressRing rate={rate} />}
              {formatDate(day, { day: "numeric" }, locale)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

const CHIP =
  "flex h-11 shrink-0 items-center gap-2 rounded-full bg-zinc-200 py-1 pl-1 pr-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=true]:bg-foreground aria-[current=true]:text-background dark:bg-zinc-900 dark:aria-[current=true]:bg-foreground";

const BUBBLE = "grid size-9 place-items-center rounded-full bg-background";

function CategoryFilter({
  categories,
  selected,
  active,
  href,
  t,
}: {
  categories: Category[];
  selected: Day;
  active?: string;
  href: DayHref;
  t: Dictionary;
}) {
  return (
    <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
      <Link href={href(selected)} aria-current={!active} className={CHIP}>
        <span className={BUBBLE}>
          <LayoutGrid className="size-[18px] text-muted-foreground" />
        </span>
        {t.categories.all}
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={href(selected, c.id)}
          aria-current={c.id === active}
          className={CHIP}
        >
          <span className={BUBBLE}>
            <CategoryIcon icon={c.icon} shaded className="size-[18px]" />
          </span>
          {categoryName(c, t)}
        </Link>
      ))}
    </nav>
  );
}

interface DayViewProps {
  selected: Day;
  today: Day;
  weekStartsOn: number;
  basePath: string;
  query?: Record<string, string>;
  category?: string;
}

export async function DayView({
  selected,
  today,
  weekStartsOn,
  basePath,
  query,
  category,
}: DayViewProps) {
  const week = weekRange(selected, weekStartsOn);
  const [weekTasks, open, categories, locale, t] = await Promise.all([
    getTasksDue(week),
    selected === today ? getOpenTasks() : Promise.resolve([]),
    getCategories(),
    getLocale(),
    getT(),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const active = category && byId.has(category) ? category : undefined;
  const href: DayHref = (day, cat) => {
    const params = new URLSearchParams({ ...query, day });
    if (cat) params.set("cat", cat);
    return `${basePath}?${params}`;
  };
  const inCategory = (task: { category_id: string | null }) =>
    !active || task.category_id === active;
  const dayTasks = weekTasks.filter(
    (task) => task.due_date === selected && inCategory(task),
  );
  const cards = [
    ...dayTasks.filter((task) => task.status !== "done"),
    ...open.filter((task) => !task.due_date && inCategory(task)),
    ...dayTasks.filter((task) => task.status === "done"),
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-center text-base font-semibold">
        {selected === today
          ? t.today.title
          : formatDate(
              selected,
              { weekday: "long", month: "long", day: "numeric" },
              locale,
            )}
      </h2>
      <DayStrip
        days={daysBetween(week)}
        selected={selected}
        today={today}
        rate={progressOf(dayTasks).rate ?? 0}
        locale={locale}
        href={href}
        category={active}
      />
      <CategoryFilter
        categories={categories}
        selected={selected}
        active={active}
        href={href}
        t={t}
      />
      {cards.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <CalendarCheck2 className="size-7" strokeWidth={1.75} />
          </span>
          <p className="mt-4 font-medium">{t.tasks.emptyDay}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.tasks.emptyDayHint}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {cards.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              category={
                task.category_id ? byId.get(task.category_id) : undefined
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

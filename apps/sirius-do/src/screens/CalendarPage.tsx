import Link from "next/link";
import { getClock } from "@workspace/sirius-core/lib/auth";
import { addDays, daysBetween, monthRange, weekRange, type Day } from "@workspace/sirius-core/lib/date";
import { MonthCalendar } from "@workspace/sirius-core/components/MonthCalendar";
import { QuickAddTask } from "@/app/_components/QuickAddTask";
import { WeekCalendar } from "@/app/_components/WeekCalendar";
import { formatDate, LOCALE } from "@/lib/locale";
import { getTasksDue } from "@/lib/tasks";

interface CalendarPageProps {
  view: "week" | "month";
  date?: string;
}

const tab =
  "rounded-sm px-2 py-1 text-sm text-muted-foreground hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground";

export default async function CalendarPage({ view, date }: CalendarPageProps) {
  const { profile, today } = await getClock();
  const weekStartsOn = profile?.week_starts_on ?? 1;
  const anchor: Day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;

  const range = view === "week" ? weekRange(anchor, weekStartsOn) : monthRange(anchor);
  const prev = view === "week" ? addDays(anchor, -7) : addDays(range.start, -1);
  const next = view === "week" ? addDays(anchor, 7) : addDays(range.end, 1);
  const tasks = await getTasksDue(range);

  const title =
    view === "week"
      ? `${formatDate(range.start, { month: "short", day: "numeric" })} – ${formatDate(range.end, { month: "short", day: "numeric", year: "numeric" })}`
      : formatDate(range.start, { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <nav className="flex items-center gap-1">
          <Link href={`/calendar?view=${view}&date=${prev}`} className={tab} aria-label="Өмнөх">
            ←
          </Link>
          <Link href={`/calendar?view=${view}`} className={tab}>
            Өнөөдөр
          </Link>
          <Link href={`/calendar?view=${view}&date=${next}`} className={tab} aria-label="Дараах">
            →
          </Link>
          <span className="mx-2 h-4 border-l" />
          <Link href={`/calendar?view=week&date=${anchor}`} aria-current={view === "week" ? "page" : undefined} className={tab}>
            7 хоног
          </Link>
          <Link href={`/calendar?view=month&date=${anchor}`} aria-current={view === "month" ? "page" : undefined} className={tab}>
            Сар
          </Link>
        </nav>
      </header>

      <QuickAddTask today={today} defaultDate={anchor} />

      {view === "week" ? (
        <WeekCalendar days={daysBetween(range)} today={today} tasks={tasks} />
      ) : (
        <MonthCalendar
          month={range}
          today={today}
          weekStartsOn={weekStartsOn}
          locale={LOCALE}
          items={tasks.map((t) => ({
            kind: "task",
            id: t.id,
            title: t.title,
            day: t.due_date!,
            at_time: t.due_time,
            done: t.status === "done",
          }))}
        />
      )}
    </div>
  );
}

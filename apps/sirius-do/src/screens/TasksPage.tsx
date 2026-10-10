import Link from "next/link";
import { getClock } from "@workspace/sirius-core/lib/auth";
import { addDays, type Day } from "@workspace/sirius-core/lib/date";
import { QuickAddTask } from "@/app/_components/QuickAddTask";
import { DayView } from "@/app/_components/DayView";
import { TaskList } from "@/app/_components/TaskList";
import { getT } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { getCategories, getDoneTasks, getOpenTasks } from "@/lib/tasks";
import type { Task } from "@/lib/types";

export type TaskFilter = "open" | "done" | "all";

type GroupKey = "overdue" | "today" | "tomorrow" | "nextWeek" | "later" | "noDate";

const GROUPS: GroupKey[] = ["overdue", "today", "tomorrow", "nextWeek", "later", "noDate"];

function groupOf(task: Task, today: Day): GroupKey {
  const due = task.due_date;
  if (!due) return "noDate";
  if (due < today) return "overdue";
  if (due === today) return "today";
  if (due === addDays(today, 1)) return "tomorrow";
  if (due <= addDays(today, 7)) return "nextWeek";
  return "later";
}

function TaskGroup({ title, count, tone, children }: { title: string; count: number; tone?: "expense"; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span className={tone === "expense" ? "text-expense" : undefined}>{title}</span>
        <span className="font-mono tabular-nums">{count}</span>
      </h2>
      <div className="rounded-xl border bg-card px-3">{children}</div>
    </section>
  );
}

function FilterTabs({ filter, t }: { filter: TaskFilter; t: Dictionary }) {
  const tabs: TaskFilter[] = ["open", "done", "all"];

  return (
    <nav className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-sm">
      {tabs.map((tab) => (
        <Link
          key={tab}
          href={tab === "open" ? "/tasks" : `/tasks?filter=${tab}`}
          aria-current={tab === filter ? "page" : undefined}
          className="rounded-md py-1.5 text-center text-muted-foreground transition-colors aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-sm"
        >
          {t.tasks[tab]}
        </Link>
      ))}
    </nav>
  );
}

export default async function TasksPage({ filter, day, category }: { filter: TaskFilter; day?: Day; category?: string }) {
  const [{ profile, today }, t, categories] = await Promise.all([getClock(), getT(), getCategories()]);
  const [open, done] = await Promise.all([
    filter === "open" ? getOpenTasks() : Promise.resolve([]),
    filter === "done" ? getDoneTasks() : Promise.resolve([]),
  ]);
  const groups = Map.groupBy(open, (task) => groupOf(task, today));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t.tasks.title}</h1>
        {filter === "open" && (
          <span className="text-sm text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground">{open.length}</span> {t.tasks.open.toLowerCase()}
          </span>
        )}
      </header>

      <FilterTabs filter={filter} t={t} />

      {filter === "all" && <DayView selected={day ?? today} today={today} weekStartsOn={profile?.week_starts_on ?? 1} basePath="/tasks" query={{ filter: "all" }} category={category} />}

      {filter === "open" && open.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t.tasks.empty}</p>
      )}

      {GROUPS.map((key) => {
        const tasks = groups.get(key);
        if (!tasks) return null;
        return (
          <TaskGroup key={key} title={t.tasks[key]} count={tasks.length} tone={key === "overdue" ? "expense" : undefined}>
            <TaskList
              tasks={tasks}
              empty=""
              showDate={key === "overdue" || key === "nextWeek" || key === "later"}
              today={key === "overdue" ? today : undefined}
            />
          </TaskGroup>
        );
      })}

      {filter === "done" &&
        (done.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t.tasks.emptyDone}</p>
        ) : (
          <TaskGroup title={t.tasks.done} count={done.length}>
            <TaskList tasks={done} empty="" showDate />
          </TaskGroup>
        ))}

      <div className="hidden md:block">
        <QuickAddTask
          today={today}
          defaultDate={filter === "all" ? (day ?? today) : today}
          categories={categories}
          defaultCategory={filter === "all" ? category : undefined}
        />
      </div>
    </div>
  );
}

import { ArrowRight, Trash2 } from "lucide-react";
import type { Day } from "@workspace/sirius-core/lib/date";
import { deleteTask, moveTask, setTaskDone } from "@/app/_actions/tasks";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatDate } from "@/lib/locale";
import { timeRange } from "@/lib/time";
import type { Task } from "@/lib/types";

const PRIORITY_MARK: Record<Task["priority"], string> = {
  low: "",
  medium: "",
  high: "!",
  urgent: "!!",
};

interface TaskListProps {
  tasks: Task[];
  empty: string;
  showDate?: boolean;
  /** Offers "move to today" on tasks due before this day. */
  today?: Day;
}

export async function TaskList({ tasks, empty, showDate, today }: TaskListProps) {
  if (tasks.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const [locale, t] = await Promise.all([getLocale(), getT()]);

  return (
    <ul className="divide-y">
      {tasks.map((task) => {
        const done = task.status === "done";
        const when = timeRange(task.due_time, task.duration_minutes, t.duration);
        return (
          <li key={task.id} className="group flex items-center gap-3 py-2 text-sm">
            <form action={setTaskDone.bind(null, task.id, !done)}>
              <button
                type="submit"
                aria-label={done ? t.task.markUndone : t.task.markDone}
                className={`flex size-4 items-center justify-center rounded-sm border ${done ? "border-app bg-app" : "hover:border-foreground"}`}
              />
            </form>
            <span className={`min-w-0 flex-1 truncate ${done ? "text-muted-foreground line-through" : ""}`}>{task.title}</span>
            <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
              {when && <span className="font-mono text-xs tabular-nums">{when}</span>}
              {PRIORITY_MARK[task.priority] && <span className="font-mono text-xs text-expense">{PRIORITY_MARK[task.priority]}</span>}
              {showDate && task.due_date && (
                <span className="font-mono text-xs">{formatDate(task.due_date, { month: "short", day: "numeric" }, locale)}</span>
              )}
              {today && !done && task.due_date && task.due_date < today && (
                <form action={moveTask.bind(null, task.id, today)}>
                  <button type="submit" className="flex items-center gap-0.5 text-xs hover:text-foreground" title={t.task.moveToToday}>
                    <ArrowRight className="size-3" aria-hidden />
                    {t.task.moveToTodayShort}
                  </button>
                </form>
              )}
              <form action={deleteTask.bind(null, task.id)} className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button type="submit" aria-label={t.task.delete} className="hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              </form>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import { useOptimistic, useTransition } from "react";
import { ArrowRight, CalendarDays, Check, Clock, Flag, NotebookPen, Trash2 } from "lucide-react";
import { addDays, type Day } from "@workspace/sirius-core/lib/date";
import { deleteTask, moveTask, setTaskDone } from "@/app/_actions/tasks";
import { CategoryIcon } from "@/app/_components/CategoryIcon";
import { categoryName } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/locale";
import { PRIORITY_COLOR } from "@/lib/priority";
import { timeRange } from "@/lib/time";
import type { Category, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACTION =
  "grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

interface TaskRowProps {
  task: Task;
  today: Day;
  category?: Category;
  /** Hides the date when the section header already says it. */
  hideDate?: boolean;
}

// Every action applies instantly and settles when the server action returns.
export function TaskRow({ task, today, category, hideDate }: TaskRowProps) {
  const { locale, t } = useI18n();
  const [state, apply] = useOptimistic({ done: task.status === "done", gone: false });
  const [, startTransition] = useTransition();
  const run = (next: Partial<typeof state>, action: () => Promise<void>) =>
    startTransition(async () => {
      apply({ ...state, ...next });
      await action();
    });
  const done = state.done;
  if (state.gone) return null;
  const color = PRIORITY_COLOR[task.priority];
  const overdue = !done && task.due_date !== null && task.due_date < today;
  const when = timeRange(task.due_time, task.duration_minutes, t.duration);
  const dayLabel =
    task.due_date === today
      ? t.today.title
      : task.due_date === addDays(today, 1)
        ? t.quickAdd.tomorrow
        : task.due_date && formatDate(task.due_date, { weekday: "short", month: "short", day: "numeric" }, locale);

  return (
    <li className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 animate-in fade-in duration-200">
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => run({ done: !done }, () => setTaskDone(task.id, !done))}
          aria-label={done ? t.task.markUndone : t.task.markDone}
          className="group/check grid size-[22px] place-items-center rounded-full border-2 transition-transform active:scale-90"
          style={{
            borderColor: color,
            backgroundColor: done ? color : `color-mix(in oklab, ${color} 12%, transparent)`,
          }}
        >
          <Check
            className={cn("size-3", done ? "text-white" : "opacity-0 group-hover/check:opacity-100")}
            strokeWidth={3.5}
            style={done ? undefined : { color }}
          />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("text-[15px] font-semibold leading-snug", done && "text-muted-foreground line-through decoration-2")}>
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {!hideDate && dayLabel && (
            <span className={cn("flex items-center gap-1", overdue && "font-semibold text-expense")}>
              <CalendarDays className="size-3.5" />
              {dayLabel}
            </span>
          )}
          {when && (
            <span className="flex items-center gap-1 font-mono tabular-nums">
              <Clock className="size-3.5" />
              {when}
            </span>
          )}
          {(task.priority === "high" || task.priority === "urgent") && (
            <span className="flex items-center gap-1 font-semibold" style={{ color }}>
              <Flag className="size-3.5" />
              {t.priority[task.priority]}
            </span>
          )}
          {task.notes && (
            <span className="flex items-center gap-1" title={task.notes}>
              <NotebookPen className="size-3.5" />
              <span className="max-w-40 truncate">{task.notes}</span>
            </span>
          )}
          {category && (
            <span className="flex items-center gap-1 font-medium">
              <CategoryIcon icon={category.icon} shaded className="size-3.5" />
              {categoryName(category, t)}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        {overdue && (
          <button
            type="button"
            onClick={() => run({ gone: true }, () => moveTask(task.id, today))}
            title={t.task.moveToToday}
            aria-label={t.task.moveToToday}
            className={ACTION}
          >
            <ArrowRight className="size-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => run({ gone: true }, () => deleteTask(task.id))}
          title={t.task.delete}
          aria-label={t.task.delete}
          className={cn(ACTION, "hover:text-destructive")}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}

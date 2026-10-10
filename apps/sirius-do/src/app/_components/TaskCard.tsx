import { BadgeCheck, Check, Flame, Leaf, Undo2, Zap, type LucideIcon } from "lucide-react";
import { setTaskDone } from "@/app/_actions/tasks";
import { PRIORITY_COLOR } from "@/app/_components/WeekCalendar";
import { CategoryIcon } from "@/app/_components/CategoryIcon";
import { categoryName } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
import { timeRange } from "@/lib/time";
import type { Category, Task } from "@/lib/types";

const PRIORITY_ICON: Record<Task["priority"], LucideIcon> = {
  low: Leaf,
  medium: BadgeCheck,
  high: Flame,
  urgent: Zap,
};

export async function TaskCard({ task, category }: { task: Task; category?: Category }) {
  const t = await getT();
  const done = task.status === "done";
  const color = category?.color ?? PRIORITY_COLOR[task.priority];
  const PriorityIcon = PRIORITY_ICON[task.priority];
  const when = timeRange(task.due_time, task.duration_minutes, t.duration) || t.today.noTime;

  return (
    <li
      className="flex items-center gap-3.5 rounded-2xl py-3 pl-3 pr-4 transition-colors"
      style={{ backgroundColor: `color-mix(in oklab, ${color} ${done ? 10 : 35}%, var(--card))` }}
    >
      {done ? (
        <span className="grid size-11 shrink-0 animate-in zoom-in-50 place-items-center rounded-full bg-green-500/15 text-green-500 duration-200">
          {category ? (
            <CategoryIcon icon={category.icon} className="size-[22px]" strokeWidth={2.25} />
          ) : (
            <PriorityIcon className="size-[22px]" strokeWidth={2.25} />
          )}
        </span>
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-background/80">
          {category ? (
            <CategoryIcon icon={category.icon} shaded className="size-[22px]" />
          ) : (
            <PriorityIcon className="size-[22px] text-muted-foreground" strokeWidth={2} />
          )}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[17px] font-semibold leading-tight ${done ? "text-muted-foreground" : ""}`}>
          {done ? (
            <span className="relative">
              {task.title}
              <PencilStrike />
            </span>
          ) : (
            task.title
          )}
        </p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {when} · {category ? categoryName(category, t) : t.priority[task.priority]}
        </p>
      </div>
      <form action={setTaskDone.bind(null, task.id, !done)}>
        {done ? (
          <button
            type="submit"
            aria-label={t.task.markUndone}
            title={t.task.markUndone}
            className="grid size-12 place-items-center rounded-full border-[3px] border-muted-foreground/40 text-muted-foreground transition hover:border-foreground/60 hover:bg-background/60 hover:text-foreground active:scale-90"
          >
            <Undo2 className="size-6" strokeWidth={2.4} />
          </button>
        ) : (
          <button
            type="submit"
            aria-label={t.task.markDone}
            title={t.task.markDone}
            className="grid size-11 place-items-center rounded-full border-[3px] transition-transform active:scale-90"
            style={{ borderColor: color }}
          >
            <Check className="size-5" strokeWidth={3} style={{ color }} />
          </button>
        )}
      </form>
    </li>
  );
}

// A slightly rising, wobbly line so the strike reads as drawn by hand.
function PencilStrike() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 16"
      preserveAspectRatio="none"
      className="pencil-strike pointer-events-none absolute -left-1 top-1/2 h-3.5 w-[calc(100%+0.5rem)] -translate-y-1/2 overflow-visible text-foreground"
    >
      <path
        d="M1,12.5 C18,11.6 34,10.4 50,9.2 S78,7 86,6.8 C91,6.7 94,5.2 99,4"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

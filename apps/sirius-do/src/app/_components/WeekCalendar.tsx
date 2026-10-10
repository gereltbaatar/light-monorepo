import type { Day } from "@workspace/sirius-core/lib/date";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatDate } from "@/lib/locale";
import { minutesToTime, timeToMinutes } from "@/lib/time";
import type { Task } from "@/lib/types";

const HOUR_PX = 60;
const DEFAULT_MINUTES = 30;

export const PRIORITY_COLOR: Record<Task["priority"], string> = {
  low: "#2dd4bf",
  medium: "var(--domain-do)",
  high: "var(--domain-fit)",
  urgent: "#f43f5e",
};

function tint(color: string): string {
  return `color-mix(in oklab, ${color} 22%, var(--card))`;
}

interface Block {
  task: Task;
  start: number;
  end: number;
  lane: number;
  lanes: number;
}

// Side-by-side lanes for tasks that overlap in time.
function layout(tasks: Task[]): Block[] {
  const sorted = tasks
    .map((task) => {
      const start = timeToMinutes(task.due_time!);
      return { task, start, end: start + (task.duration_minutes ?? DEFAULT_MINUTES), lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.start - b.start);

  let cluster: Block[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(...cluster.map((b) => b.lane)) + 1;
    cluster.forEach((b) => (b.lanes = lanes));
    cluster = [];
  };

  for (const block of sorted) {
    if (cluster.length && block.start >= clusterEnd) flush();
    const busy = new Set(cluster.filter((b) => b.end > block.start).map((b) => b.lane));
    while (busy.has(block.lane)) block.lane++;
    cluster.push(block);
    clusterEnd = Math.max(clusterEnd, block.end);
  }
  if (cluster.length) flush();
  return sorted;
}

export async function WeekCalendar({ days, today, tasks }: { days: Day[]; today: Day; tasks: Task[] }) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const timed = tasks.filter((t) => t.due_time);
  const firstHour = Math.min(7, ...timed.map((t) => Math.floor(timeToMinutes(t.due_time!) / 60)));
  const hours = Array.from({ length: 24 - firstHour }, (_, i) => firstHour + i);

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="min-w-[820px]">
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b text-xs">
          <div />
          {days.map((day) => (
            <div key={day} className="flex h-11 items-center justify-center gap-1.5 border-l font-medium text-muted-foreground">
              <span className={`grid size-6 place-items-center rounded-full font-mono tabular-nums ${day === today ? "bg-app text-white" : ""}`}>
                {formatDate(day, { day: "numeric" }, locale)}
              </span>
              {formatDate(day, { weekday: "short" }, locale)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b text-xs">
          <div className="px-1 py-2 text-right text-[10px] text-muted-foreground">{t.calendar.untimed}</div>
          {days.map((day) => (
            <ul key={day} className="min-h-9 space-y-1 border-l p-1.5">
              {tasks
                .filter((t) => t.due_date === day && !t.due_time)
                .map((t) => (
                  <li
                    key={t.id}
                    className={`truncate rounded-md border-l-2 px-2 py-1 font-medium ${t.status === "done" ? "text-muted-foreground line-through opacity-60" : ""}`}
                    style={{ borderColor: PRIORITY_COLOR[t.priority], backgroundColor: tint(PRIORITY_COLOR[t.priority]) }}
                  >
                    {t.title}
                  </li>
                ))}
            </ul>
          ))}
        </div>

        <div className="relative grid grid-cols-[3.5rem_repeat(7,1fr)]" style={{ height: hours.length * HOUR_PX }}>
          <div>
            {hours.map((h) => (
              <div key={h} className="-translate-y-1.5 pr-2 text-right font-mono text-[11px] text-muted-foreground tabular-nums" style={{ height: HOUR_PX }}>
                {h > firstHour && minutesToTime(h * 60)}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day} className={`relative border-l ${day === today ? "bg-muted/30" : ""}`}>
              {hours.map((h) => (
                <div key={h} className="border-b border-border/60" style={{ height: HOUR_PX }} />
              ))}
              {layout(timed.filter((t) => t.due_date === day)).map((b) => (
                <div
                  key={b.task.id}
                  title={`${b.task.title} · ${minutesToTime(b.start)}–${minutesToTime(b.end)}`}
                  className={`absolute overflow-hidden rounded-lg border-l-2 px-2 py-1 text-xs leading-tight ${b.task.status === "done" ? "text-muted-foreground line-through opacity-60" : ""}`}
                  style={{
                    top: ((b.start - firstHour * 60) / 60) * HOUR_PX + 2,
                    height: Math.max(((b.end - b.start) / 60) * HOUR_PX - 4, 22),
                    left: `calc(${(b.lane / b.lanes) * 100}% + 3px)`,
                    width: `calc(${100 / b.lanes}% - 6px)`,
                    borderColor: PRIORITY_COLOR[b.task.priority],
                    backgroundColor: tint(PRIORITY_COLOR[b.task.priority]),
                  }}
                >
                  <div className="truncate font-medium">{b.task.title}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {minutesToTime(b.start)}–{minutesToTime(b.end)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

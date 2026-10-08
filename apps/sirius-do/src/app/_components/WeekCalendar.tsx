import type { Day } from "@workspace/sirius-core/lib/date";
import { formatDate } from "@/lib/locale";
import { minutesToTime, timeToMinutes } from "@/lib/time";
import type { Task } from "@/lib/types";

const HOUR_PX = 44;
const DEFAULT_MINUTES = 30;

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

export function WeekCalendar({ days, today, tasks }: { days: Day[]; today: Day; tasks: Task[] }) {
  const timed = tasks.filter((t) => t.due_time);
  const firstHour = Math.min(7, ...timed.map((t) => Math.floor(timeToMinutes(t.due_time!) / 60)));
  const hours = Array.from({ length: 24 - firstHour }, (_, i) => firstHour + i);

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b text-xs">
          <div />
          {days.map((day) => (
            <div key={day} className={`border-l px-2 py-1.5 ${day === today ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {formatDate(day, { weekday: "short" })} <span className="font-mono tabular-nums">{formatDate(day, { day: "numeric" })}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b text-xs">
          <div className="px-1 py-1 text-[10px] text-muted-foreground">цаггүй</div>
          {days.map((day) => (
            <ul key={day} className="min-h-7 space-y-0.5 border-l p-1">
              {tasks
                .filter((t) => t.due_date === day && !t.due_time)
                .map((t) => (
                  <li
                    key={t.id}
                    className={`truncate rounded-sm border-l-2 border-app bg-muted px-1 py-0.5 ${t.status === "done" ? "text-muted-foreground line-through" : ""}`}
                  >
                    {t.title}
                  </li>
                ))}
            </ul>
          ))}
        </div>

        <div className="relative grid grid-cols-[3rem_repeat(7,1fr)]" style={{ height: hours.length * HOUR_PX }}>
          <div>
            {hours.map((h) => (
              <div key={h} className="pr-1 text-right font-mono text-[10px] text-muted-foreground tabular-nums" style={{ height: HOUR_PX }}>
                {minutesToTime(h * 60)}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day} className={`relative border-l ${day === today ? "bg-surface/40" : ""}`}>
              {hours.map((h) => (
                <div key={h} className="border-b border-dashed border-border/60" style={{ height: HOUR_PX }} />
              ))}
              {layout(timed.filter((t) => t.due_date === day)).map((b) => (
                <div
                  key={b.task.id}
                  title={`${b.task.title} · ${minutesToTime(b.start)}–${minutesToTime(b.end)}`}
                  className={`absolute overflow-hidden rounded-sm border-l-2 border-app bg-card px-1 py-0.5 text-[11px] leading-tight shadow-sm ring-1 ring-border ${b.task.status === "done" ? "text-muted-foreground line-through" : ""}`}
                  style={{
                    top: ((b.start - firstHour * 60) / 60) * HOUR_PX,
                    height: Math.max(((b.end - b.start) / 60) * HOUR_PX, 18),
                    left: `calc(${(b.lane / b.lanes) * 100}% + 2px)`,
                    width: `calc(${100 / b.lanes}% - 4px)`,
                  }}
                >
                  <div className="truncate font-medium">{b.task.title}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{minutesToTime(b.start)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

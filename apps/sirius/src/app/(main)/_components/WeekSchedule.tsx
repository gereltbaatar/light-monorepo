import { appUrl, type SiriusAppId } from "@workspace/sirius-core/lib/apps";
import { daysBetween, formatDay, type Day, type DayRange } from "@workspace/sirius-core/lib/date";
import type { CalendarItem, CalendarItemKind } from "@workspace/sirius-core/lib/types";

const HOUR_PX = 72;

export const KIND: Record<CalendarItemKind, { label: string; color: string; app: SiriusAppId }> = {
  task: { label: "Task", color: "var(--domain-do)", app: "do" },
  event: { label: "Event", color: "#2dd4bf", app: "do" },
  workout: { label: "Workout", color: "var(--domain-fit)", app: "fit" },
};

export function minutesOf(time: string): number {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

interface Placed {
  item: CalendarItem;
  start: number;
  lane: number;
  lanes: number;
}

// Items have no duration, so each one is drawn as an hour.
function layoutDay(items: CalendarItem[]): Placed[] {
  const timed = items
    .filter((i) => i.at_time)
    .map((item) => ({ item, start: minutesOf(item.at_time!), lane: 0, lanes: 1 }))
    .sort((a, b) => a.start - b.start);

  let cluster: Placed[] = [];
  let clusterEnd = -1;
  const flush = () => cluster.forEach((p) => (p.lanes = Math.max(...cluster.map((c) => c.lane)) + 1));

  for (const p of timed) {
    if (p.start >= clusterEnd) {
      flush();
      cluster = [];
    }
    const taken = new Set(cluster.filter((c) => c.start + 60 > p.start).map((c) => c.lane));
    while (taken.has(p.lane)) p.lane++;
    cluster.push(p);
    clusterEnd = Math.max(clusterEnd, p.start + 60);
  }
  flush();
  return timed;
}

interface WeekScheduleProps {
  week: DayRange;
  today: Day;
  items: CalendarItem[];
}

export function WeekSchedule({ week, today, items }: WeekScheduleProps) {
  const days = daysBetween(week);
  const byDay = Map.groupBy(items, (i) => i.day);
  const times = items.filter((i) => i.at_time).map((i) => minutesOf(i.at_time!));
  const firstHour = Math.min(8, ...times.map((t) => Math.floor(t / 60)));
  const lastHour = Math.min(24, Math.max(18, ...times.map((t) => Math.floor(t / 60) + 1)));
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);
  const allDay = items.filter((i) => !i.at_time);
  const cols = "grid-cols-[64px_repeat(7,minmax(0,1fr))]";

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="min-w-[820px]">
        <div className={`grid ${cols} border-b`}>
          <div />
          {days.map((day) => (
            <div key={day} className="flex h-11 items-center justify-center gap-1.5 border-l text-xs font-medium text-muted-foreground">
              <span
                className={`grid size-6 place-items-center rounded-full font-mono tabular-nums ${day === today ? "bg-blue-500 text-white" : ""}`}
              >
                {formatDay(day, { day: "2-digit" })}
              </span>
              <span className="uppercase">{formatDay(day, { weekday: "short" })}</span>
            </div>
          ))}
        </div>

        {allDay.length > 0 && (
          <div className={`grid ${cols} border-b`}>
            <div className="px-2 py-2 text-right text-[10px] uppercase text-muted-foreground">All day</div>
            {days.map((day) => (
              <div key={day} className="space-y-1 border-l p-1.5">
                {(byDay.get(day) ?? [])
                  .filter((i) => !i.at_time)
                  .map((item) => (
                    <a
                      key={`${item.kind}-${item.id}`}
                      href={appUrl(KIND[item.kind].app)}
                      className={`block truncate rounded-md border-l-2 px-2 py-1 text-xs font-medium ${item.done ? "line-through opacity-50" : ""}`}
                      style={{ borderColor: KIND[item.kind].color, backgroundColor: `color-mix(in oklab, ${KIND[item.kind].color} 18%, transparent)` }}
                    >
                      {item.title}
                    </a>
                  ))}
              </div>
            ))}
          </div>
        )}

        <div className={`grid ${cols}`}>
          <div>
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_PX }} className="-translate-y-2 pr-2 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
                {h > firstHour && `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div
              key={day}
              className={`relative border-l ${day === today ? "bg-muted/30" : ""}`}
              style={{
                height: hours.length * HOUR_PX,
                backgroundImage: "linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                backgroundSize: `100% ${HOUR_PX}px`,
              }}
            >
              {layoutDay(byDay.get(day) ?? []).map(({ item, start, lane, lanes }) => {
                const kind = KIND[item.kind];
                return (
                  <a
                    key={`${item.kind}-${item.id}`}
                    href={appUrl(kind.app)}
                    className={`absolute flex flex-col overflow-hidden rounded-lg border-l-2 px-2.5 py-1.5 text-xs transition-[filter] hover:brightness-125 ${item.done ? "opacity-50" : ""}`}
                    style={{
                      top: ((start - firstHour * 60) / 60) * HOUR_PX + 3,
                      height: HOUR_PX - 6,
                      left: `calc(${(lane / lanes) * 100}% + 4px)`,
                      width: `calc(${100 / lanes}% - 8px)`,
                      borderColor: kind.color,
                      backgroundColor: `color-mix(in oklab, ${kind.color} 20%, var(--card))`,
                    }}
                  >
                    <span className={`line-clamp-2 font-medium leading-snug ${item.done ? "line-through" : ""}`}>{item.title}</span>
                    <span className="mt-auto flex items-center gap-1.5 text-muted-foreground">
                      <span className="font-mono tabular-nums">{formatTime(item.at_time!)}</span>
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: kind.color }} />
                      {kind.label}
                    </span>
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { daysBetween, formatDay, weekRange, type Day, type DayRange } from "../lib/date";
import type { CalendarItem, CalendarItemKind } from "../lib/types";

const KIND_COLOR: Record<CalendarItemKind, string> = {
  task: "var(--domain-do)",
  event: "var(--muted-foreground)",
  workout: "var(--domain-fit)",
};

interface MonthCalendarProps {
  month: DayRange;
  today: Day;
  items: CalendarItem[];
  weekStartsOn?: number;
  locale?: string;
}

export function MonthCalendar({ month, today, items, weekStartsOn = 1, locale }: MonthCalendarProps) {
  const grid = daysBetween({
    start: weekRange(month.start, weekStartsOn).start,
    end: weekRange(month.end, weekStartsOn).end,
  });
  const byDay = Map.groupBy(items, (item) => item.day);

  return (
    <div>
      <div className="grid grid-cols-7 border-b pb-1 text-xs text-muted-foreground">
        {grid.slice(0, 7).map((day) => (
          <div key={day} className="px-1.5">
            {formatDay(day, { weekday: "short" }, locale)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((day) => {
          const dayItems = byDay.get(day) ?? [];
          const outside = day < month.start || day > month.end;
          return (
            <div key={day} className={`min-h-20 border-b border-r p-1.5 nth-[7n+1]:border-l ${outside ? "bg-surface/50" : ""}`}>
              <div
                className={`mb-1 font-mono text-xs tabular-nums ${day === today ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                {formatDay(day, { day: "numeric" }, locale)}
              </div>
              <ul className="space-y-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <li key={`${item.kind}-${item.id}`} className={`flex items-center gap-1 truncate text-xs ${item.done ? "text-muted-foreground line-through" : ""}`}>
                    <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: KIND_COLOR[item.kind] }} />
                    <span className="truncate">{item.title}</span>
                  </li>
                ))}
                {dayItems.length > 3 && <li className="text-xs text-muted-foreground">+{dayItems.length - 3}</li>}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

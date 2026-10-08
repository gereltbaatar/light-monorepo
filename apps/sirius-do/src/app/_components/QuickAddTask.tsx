"use client";

import { useActionState, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { addDays, type Day } from "@workspace/sirius-core/lib/date";
import { createTask, type TaskActionResult } from "@/app/_actions/tasks";
import { formatDate } from "@/lib/locale";
import { parseTask } from "@/lib/parse-task";
import { timeRange } from "@/lib/time";

interface Fields {
  due_date: string;
  due_time: string;
  duration_minutes: string;
  priority: string;
}

interface QuickAddTaskProps {
  today: Day;
  defaultDate?: Day | null;
}

function dayLabel(day: string, today: Day): string {
  if (day === today) return "Өнөөдөр";
  if (day === addDays(today, 1)) return "Маргааш";
  return formatDate(day, { weekday: "short", month: "short", day: "numeric" });
}

const fieldClass = "h-9 rounded-md border bg-background px-2 text-sm";

export function QuickAddTask({ today, defaultDate = today }: QuickAddTaskProps) {
  const [text, setText] = useState("");
  const [overrides, setOverrides] = useState<Partial<Fields>>({});
  const [open, setOpen] = useState(false);

  const [state, action, pending] = useActionState<TaskActionResult, FormData>(async (prev, formData) => {
    const result = await createTask(prev, formData);
    if (result && "ok" in result) {
      setText("");
      setOverrides({});
    }
    return result;
  }, undefined);

  const parsed = parseTask(text, today);
  const f: Fields = {
    due_date: parsed.dueDate ?? defaultDate ?? "",
    due_time: parsed.dueTime ?? "",
    duration_minutes: parsed.durationMinutes ? String(parsed.durationMinutes) : "",
    priority: parsed.priority ?? "medium",
    ...overrides,
  };
  const set = (key: keyof Fields, value: string) => setOverrides((o) => ({ ...o, [key]: value }));

  const chips = [
    f.due_date && dayLabel(f.due_date, today),
    (f.due_time || f.duration_minutes) && timeRange(f.due_time || null, Number(f.duration_minutes) || null),
    f.priority === "high" && "! өндөр",
    f.priority === "urgent" && "!! яаралтай",
  ].filter(Boolean) as string[];

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="title" value={parsed.title} />
      {Object.entries(f).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="маргааш 19 цагт тамир 1 цаг"
          aria-label="Шинэ ажил"
          autoComplete="off"
        />
        <Button type="button" variant="outline" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          Дэлгэрэнгүй
        </Button>
        <Button type="submit" disabled={pending || !parsed.title}>
          Нэмэх
        </Button>
      </div>

      {chips.length > 0 && parsed.title && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-medium">{parsed.title}</span>
          {chips.map((chip) => (
            <span key={chip} className="rounded-sm bg-muted px-1.5 py-0.5 text-muted-foreground">
              {chip}
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="grid gap-2 rounded-md border bg-card p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">Огноо</span>
            <input type="date" className={fieldClass} value={f.due_date} onChange={(e) => set("due_date", e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">Эхлэх цаг</span>
            <input type="time" className={fieldClass} value={f.due_time} onChange={(e) => set("due_time", e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">Үргэлжлэх (мин)</span>
            <input
              type="number"
              min={5}
              step={5}
              className={fieldClass}
              value={f.duration_minutes}
              onChange={(e) => set("duration_minutes", e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">Ач холбогдол</span>
            <select className={fieldClass} value={f.priority} onChange={(e) => set("priority", e.target.value)}>
              <option value="low">Бага</option>
              <option value="medium">Дунд</option>
              <option value="high">Өндөр</option>
              <option value="urgent">Яаралтай</option>
            </select>
          </label>
        </div>
      )}

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

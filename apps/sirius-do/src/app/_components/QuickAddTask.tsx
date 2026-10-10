"use client";

import { useActionState, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { addDays, type Day } from "@workspace/sirius-core/lib/date";
import { createTask, type TaskActionResult } from "@/app/_actions/tasks";
import { categoryName } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { formatDate } from "@/lib/locale";
import { parseTask } from "@/lib/parse-task";
import { timeRange } from "@/lib/time";
import type { Category } from "@/lib/types";

interface Fields {
  due_date: string;
  due_time: string;
  duration_minutes: string;
  priority: string;
  category_id: string;
}

interface QuickAddTaskProps {
  today: Day;
  defaultDate?: Day | null;
  categories?: Category[];
  defaultCategory?: string;
  onCreated?: () => void;
}

function dayLabel(day: string, today: Day, locale: Locale, t: Dictionary): string {
  if (day === today) return t.today.title;
  if (day === addDays(today, 1)) return t.quickAdd.tomorrow;
  return formatDate(day, { weekday: "short", month: "short", day: "numeric" }, locale);
}

const fieldClass = "h-9 rounded-md border bg-background px-2 text-sm";

export function QuickAddTask({ today, defaultDate = today, categories = [], defaultCategory, onCreated }: QuickAddTaskProps) {
  const { locale, t } = useI18n();
  const [text, setText] = useState("");
  const [overrides, setOverrides] = useState<Partial<Fields>>({});
  const [open, setOpen] = useState(false);

  const [state, action, pending] = useActionState<TaskActionResult, FormData>(async (prev, formData) => {
    const result = await createTask(prev, formData);
    if (result && "ok" in result) {
      setText("");
      setOverrides({});
      onCreated?.();
    }
    return result;
  }, undefined);

  const parsed = parseTask(text, today);
  const f: Fields = {
    due_date: parsed.dueDate ?? defaultDate ?? "",
    due_time: parsed.dueTime ?? "",
    duration_minutes: parsed.durationMinutes ? String(parsed.durationMinutes) : "",
    priority: parsed.priority ?? "medium",
    category_id: defaultCategory ?? "",
    ...overrides,
  };
  const selectedCategory = categories.find((c) => c.id === f.category_id);
  const set = (key: keyof Fields, value: string) => setOverrides((o) => ({ ...o, [key]: value }));

  const chips = [
    f.due_date && dayLabel(f.due_date, today, locale, t),
    (f.due_time || f.duration_minutes) && timeRange(f.due_time || null, Number(f.duration_minutes) || null, t.duration),
    f.priority === "high" && `! ${t.priority.high.toLowerCase()}`,
    f.priority === "urgent" && `!! ${t.priority.urgent.toLowerCase()}`,
    selectedCategory && categoryName(selectedCategory, t),
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
          placeholder={t.quickAdd.placeholder}
          aria-label={t.quickAdd.label}
          autoComplete="off"
        />
        <Button type="button" variant="outline" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {t.quickAdd.details}
        </Button>
        <Button type="submit" disabled={pending || !parsed.title}>
          {t.quickAdd.add}
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
        <div className="grid gap-2 rounded-md border bg-card p-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">{t.quickAdd.date}</span>
            <input type="date" className={fieldClass} value={f.due_date} onChange={(e) => set("due_date", e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">{t.quickAdd.startTime}</span>
            <input type="time" className={fieldClass} value={f.due_time} onChange={(e) => set("due_time", e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">{t.quickAdd.duration}</span>
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
            <span className="text-xs text-muted-foreground">{t.quickAdd.priority}</span>
            <select className={fieldClass} value={f.priority} onChange={(e) => set("priority", e.target.value)}>
              <option value="low">{t.priority.low}</option>
              <option value="medium">{t.priority.medium}</option>
              <option value="high">{t.priority.high}</option>
              <option value="urgent">{t.priority.urgent}</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">{t.quickAdd.category}</span>
            <select className={fieldClass} value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">{t.categories.none}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryName(c, t)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

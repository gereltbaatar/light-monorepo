"use client";

import { useActionState, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  CalendarDays,
  Check,
  Clock,
  Flag,
  Hourglass,
  Loader2,
  NotebookPen,
  Settings2,
  Sparkles,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { addDays, type Day } from "@workspace/sirius-core/lib/date";
import { createTask, type TaskActionResult } from "@/app/_actions/tasks";
import { CategoryIcon } from "@/app/_components/CategoryIcon";
import { categoryName, detectCategory } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/locale";
import { parseTask } from "@/lib/parse-task";
import { PRIORITY_COLOR, PRIORITY_ICON } from "@/lib/priority";
import { formatDuration, minutesToTime, timeRange } from "@/lib/time";
import { PRIORITIES, type Category, type TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Fields {
  due_date: string;
  due_time: string;
  duration_minutes: string;
  priority: TaskPriority;
  category_id: string;
}

interface Option {
  value: string;
  label: string;
  search?: string;
  icon?: React.ReactNode;
}

const TIMES = Array.from({ length: 36 }, (_, i) =>
  minutesToTime(6 * 60 + i * 30),
);
const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];

const PILL =
  "inline-flex h-8 max-w-full shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors data-[empty=true]:border-dashed data-[empty=true]:border-muted-foreground/40 data-[empty=true]:text-muted-foreground data-[empty=true]:hover:border-muted-foreground/70 data-[empty=true]:hover:text-foreground data-[empty=false]:border-transparent data-[empty=false]:bg-muted data-[state=open]:ring-2 data-[state=open]:ring-ring/40";

function AutoBadge() {
  const { t } = useI18n();
  return (
    <span
      title={t.addTask.auto}
      className="grid size-4 shrink-0 place-items-center rounded-full bg-app/20 text-app"
    >
      <Sparkles className="size-2.5" />
    </span>
  );
}

interface SelectMenuProps {
  icon: LucideIcon;
  label: string;
  valueIcon?: React.ReactNode;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  display: React.ReactNode;
  empty: boolean;
  auto: boolean;
  footer?: (close: () => void) => React.ReactNode;
}

// GitHub issue-style field: a pill that opens a filterable list.
function SelectMenu({
  icon: Icon,
  label,
  valueIcon,
  options,
  value,
  onChange,
  display,
  empty,
  auto,
  footer,
}: SelectMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-empty={empty}
          aria-label={label}
          title={label}
          className={PILL}
        >
          {empty || !valueIcon ? (
            <Icon className="size-4 shrink-0" />
          ) : (
            valueIcon
          )}
          <span className="truncate">{empty ? label : display}</span>
          {auto && <AutoBadge />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 overflow-hidden rounded-xl p-0"
      >
        <Command className="bg-popover">
          <CommandInput placeholder={t.addTask.filter} className="h-10" />
          <CommandList className="max-h-64">
            <CommandEmpty>{t.addTask.noResults}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value || "none"}
                  value={`${o.label} ${o.search ?? ""} ${o.value}`}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="gap-2 rounded-md"
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      o.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {o.icon}
                  <span className="truncate">{o.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {footer && (
            <div className="border-t p-1.5">{footer(() => setOpen(false))}</div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function NotesMenu({
  value,
  onChange,
  auto,
}: {
  value: string;
  onChange: (value: string) => void;
  auto: boolean;
}) {
  const { t } = useI18n();
  const empty = !value.trim();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-empty={empty}
          aria-label={t.addTask.notes}
          title={t.addTask.notes}
          className={PILL}
        >
          <NotebookPen className="size-4 shrink-0" />
          <span className="max-w-48 truncate">
            {empty ? t.addTask.notes : value}
          </span>
          {auto && <AutoBadge />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 rounded-xl p-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.addTask.notesPlaceholder}
          rows={4}
          autoFocus
          className="w-full resize-none rounded-lg bg-muted px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
        />
      </PopoverContent>
    </Popover>
  );
}

const FOOTER_ITEM =
  "relative flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

const KEYCAP =
  "grid h-6 min-w-6 place-items-center rounded-md bg-background/15 px-1.5 font-sans text-xs font-medium text-background/80 ring-1 ring-background/10 ring-inset";

function subscribeNothing() {
  return () => {};
}

const CREATE_MORE_KEY = "sirius-do:create-more";
const createMoreListeners = new Set<() => void>();

function readCreateMore(): boolean {
  try {
    return localStorage.getItem(CREATE_MORE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveCreateMore(value: boolean) {
  try {
    localStorage.setItem(CREATE_MORE_KEY, value ? "1" : "0");
  } catch {}
  createMoreListeners.forEach((l) => l());
}

function subscribeCreateMore(listener: () => void) {
  createMoreListeners.add(listener);
  return () => createMoreListeners.delete(listener);
}

interface AddTaskFormProps {
  today: Day;
  categories: Category[];
  defaultDate?: Day;
  defaultCategory?: string;
}

export function AddTaskForm({
  today,
  categories,
  defaultDate = today,
  defaultCategory,
}: AddTaskFormProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const createMore = useSyncExternalStore(
    subscribeCreateMore,
    readCreateMore,
    () => false,
  );
  const isMac = useSyncExternalStore(
    subscribeNothing,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => true,
  );
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Partial<Fields>>({});

  const parsed = parseTask(text, today);
  const detected = detectCategory(parsed.title, categories);
  const title = detected.title;
  const auto = {
    due_date: parsed.dueDate !== null,
    due_time: parsed.dueTime !== null,
    duration_minutes: parsed.durationMinutes !== null,
    priority: parsed.priority !== null,
    category_id: detected.categoryId !== null,
  };
  const f: Fields = {
    due_date: parsed.dueDate ?? defaultDate,
    due_time: parsed.dueTime ?? "",
    duration_minutes: parsed.durationMinutes
      ? String(parsed.durationMinutes)
      : "",
    priority: parsed.priority ?? "medium",
    category_id: detected.categoryId ?? defaultCategory ?? "",
    ...overrides,
  };
  const isAuto = (key: keyof Fields) =>
    auto[key] && overrides[key] === undefined;
  const set = (key: keyof Fields, value: string) =>
    setOverrides((o) => ({ ...o, [key]: value }));
  const noteText = notes ?? parsed.notes ?? "";

  const category = categories.find((c) => c.id === f.category_id);
  const when = timeRange(
    f.due_time || null,
    Number(f.duration_minutes) || null,
    t.duration,
  );

  function dayLabel(day: string): string {
    if (!day) return t.addTask.noDate;
    if (day === today) return t.today.title;
    if (day === addDays(today, 1)) return t.quickAdd.tomorrow;
    return formatDate(
      day,
      { weekday: "short", month: "short", day: "numeric" },
      locale,
    );
  }

  const dateOptions: Option[] = [
    ...Array.from({ length: 14 }, (_, i) => {
      const day = addDays(today, i);
      return {
        value: day,
        label: dayLabel(day),
        search: formatDate(day, { weekday: "long" }, locale),
      };
    }),
    { value: "", label: t.addTask.noDate },
  ];
  if (f.due_date && !dateOptions.some((o) => o.value === f.due_date))
    dateOptions.unshift({ value: f.due_date, label: dayLabel(f.due_date) });

  const time = f.due_time.slice(0, 5);
  const timeOptions: Option[] = [
    { value: "", label: t.addTask.noTime },
    ...TIMES.map((v) => ({ value: v, label: v })),
  ];
  if (time && !TIMES.includes(time))
    timeOptions.splice(1, 0, { value: time, label: time });

  const durationOptions: Option[] = [
    { value: "", label: t.addTask.noDuration },
    ...DURATIONS.map((m) => ({
      value: String(m),
      label: formatDuration(m, t.duration),
    })),
  ];
  if (f.duration_minutes && !DURATIONS.includes(Number(f.duration_minutes))) {
    durationOptions.splice(1, 0, {
      value: f.duration_minutes,
      label: formatDuration(Number(f.duration_minutes), t.duration),
    });
  }

  const priorityOptions: Option[] = PRIORITIES.map((p) => {
    const Icon = PRIORITY_ICON[p];
    return {
      value: p,
      label: t.priority[p],
      icon: <Icon className="size-4" style={{ color: PRIORITY_COLOR[p] }} />,
    };
  });

  const categoryOptions: Option[] = [
    { value: "", label: t.categories.none },
    ...categories.map((c) => ({
      value: c.id,
      label: categoryName(c, t),
      icon: <CategoryIcon icon={c.icon} shaded className="size-4" />,
    })),
  ];

  const [state, action, pending] = useActionState<TaskActionResult, FormData>(
    async (prev, formData) => {
      const result = await createTask(prev, formData);
      if (result && "ok" in result) {
        toast.success(title, {
          description: [dayLabel(f.due_date), when].filter(Boolean).join(" · "),
        });
        if (readCreateMore()) {
          setText("");
          setNotes(null);
          setOverrides({});
          titleRef.current?.focus();
        } else {
          router.push(f.due_date ? `/?day=${f.due_date}` : "/tasks");
        }
      }
      return result;
    },
    undefined,
  );

  const PriorityIcon = PRIORITY_ICON[f.priority];
  const detectedChips = [
    auto.due_date && dayLabel(f.due_date),
    (auto.due_time || auto.duration_minutes) &&
      timeRange(parsed.dueTime, parsed.durationMinutes, t.duration),
    auto.priority && t.priority[f.priority],
    auto.category_id && category && categoryName(category, t),
    parsed.notes && t.addTask.notes,
  ].filter(Boolean) as string[];

  return (
    <form
      ref={formRef}
      action={action}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
          formRef.current?.requestSubmit();
      }}
      className="mx-auto max-w-2xl space-y-4 pb-28 md:pb-6"
    >
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="notes" value={noteText} />
      {Object.entries(f).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      <header className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t.addTask.back}
          className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground active:scale-95"
        >
          <X className="size-5" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">{t.addTask.title}</h1>
      </header>

      <div className="rounded-[28px] bg-card p-5">
        <input
          ref={titleRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          placeholder={t.addTask.placeholder}
          aria-label={t.addTask.title}
          autoFocus
          autoComplete="off"
          className="w-full bg-transparent text-xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60"
        />
        {detectedChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="flex items-center gap-1 text-xs font-semibold text-app">
              <Sparkles className="size-3.5" />
              {t.addTask.detected}
            </span>
            {detectedChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-app/15 px-2.5 py-0.5 text-xs font-semibold text-app"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SelectMenu
          icon={CalendarDays}
          label={t.addTask.when}
          options={dateOptions}
          value={f.due_date}
          onChange={(v) => set("due_date", v)}
          display={dayLabel(f.due_date)}
          empty={!f.due_date}
          auto={isAuto("due_date")}
          footer={(close) => (
            <label className={FOOTER_ITEM}>
              <CalendarDays className="size-4" />
              {t.addTask.specificDate}
              <input
                type="date"
                value={f.due_date}
                onChange={(e) => {
                  set("due_date", e.target.value);
                  close();
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          )}
        />
        <SelectMenu
          icon={Clock}
          label={t.addTask.time}
          options={timeOptions}
          value={time}
          onChange={(v) => set("due_time", v)}
          display={<span className="font-mono">{time}</span>}
          empty={!time}
          auto={isAuto("due_time")}
          footer={(close) => (
            <label className={FOOTER_ITEM}>
              <Clock className="size-4" />
              {t.addTask.specificTime}
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  set("due_time", e.target.value);
                  close();
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          )}
        />
        <SelectMenu
          icon={Hourglass}
          label={t.addTask.duration}
          options={durationOptions}
          value={f.duration_minutes}
          onChange={(v) => set("duration_minutes", v)}
          display={
            f.duration_minutes &&
            formatDuration(Number(f.duration_minutes), t.duration)
          }
          empty={!f.duration_minutes}
          auto={isAuto("duration_minutes")}
        />
        <span className="mx-1 h-6 w-px bg-border" aria-hidden />
        <SelectMenu
          icon={Flag}
          label={t.addTask.priority}
          options={priorityOptions}
          value={f.priority}
          onChange={(v) => set("priority", v)}
          valueIcon={
            <PriorityIcon
              className="size-4 shrink-0"
              style={{ color: PRIORITY_COLOR[f.priority] }}
            />
          }
          display={t.priority[f.priority]}
          empty={!auto.priority && overrides.priority === undefined}
          auto={isAuto("priority")}
        />
        <SelectMenu
          icon={Tags}
          label={t.addTask.category}
          options={categoryOptions}
          value={f.category_id}
          onChange={(v) => set("category_id", v)}
          valueIcon={
            category && (
              <CategoryIcon
                icon={category.icon}
                shaded
                className="size-4 shrink-0"
              />
            )
          }
          display={category && categoryName(category, t)}
          empty={!category}
          auto={isAuto("category_id")}
          footer={() => (
            <Link href="/categories" className={FOOTER_ITEM}>
              <Settings2 className="size-4" />
              {t.addTask.manageCategories}
            </Link>
          )}
        />
        <span className="mx-1 h-6 w-px bg-border" aria-hidden />
        <NotesMenu
          value={noteText}
          onChange={setNotes}
          auto={parsed.notes !== null && notes === null}
        />
      </div>

      {state && "error" in state && (
        <p className="px-1 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-background via-background to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] md:sticky md:px-0">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <label className="flex shrink-0 cursor-pointer select-none items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <Checkbox
              checked={createMore}
              onCheckedChange={(v) => saveCreateMore(v === true)}
              className="size-[18px] rounded-[5px]"
            />
            {t.addTask.createMore}
          </label>
          <button
            type="submit"
            disabled={pending || !title}
            className="ml-auto flex h-10 shrink-0 items-center gap-2.5 rounded-xl bg-foreground pr-2 pl-4 text-sm font-semibold text-background shadow-sm transition-all hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 max-md:pr-4"
          >
            {pending ? t.addTask.saving : t.addTask.save}
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span className="hidden items-center gap-1 md:flex" aria-hidden>
                <kbd className={KEYCAP}>{isMac ? "⌘" : "Ctrl"}</kbd>
                <kbd className={KEYCAP}>↵</kbd>
              </span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

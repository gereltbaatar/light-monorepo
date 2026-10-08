import { getClock } from "@workspace/sirius-core/lib/auth";
import { addDays } from "@workspace/sirius-core/lib/date";
import { Meter } from "@workspace/sirius-core/components/Meter";
import { Section } from "@workspace/sirius-core/components/Section";
import { Stat } from "@workspace/sirius-core/components/Stat";
import { QuickAddTask } from "@/app/_components/QuickAddTask";
import { TaskList } from "@/app/_components/TaskList";
import { formatDate } from "@/lib/locale";
import { getOverdueTasks, getTasksDue, progressOf } from "@/lib/tasks";
import { formatTime } from "@/lib/time";

export default async function TodayPage() {
  const { today, week } = await getClock();
  const [weekTasks, overdue, upcoming] = await Promise.all([
    getTasksDue(week),
    getOverdueTasks(today),
    getTasksDue({ start: addDays(today, 1), end: addDays(today, 7) }),
  ]);

  const todayTasks = weekTasks.filter((t) => t.due_date === today);
  const progress = progressOf(todayTasks);
  const weekProgress = progressOf(weekTasks.filter((t) => t.due_date! <= today));
  const open = todayTasks.filter((t) => t.status !== "done");
  const next = [...open.filter((t) => t.due_time), ...open.filter((t) => !t.due_time)].slice(0, 5);
  const upcomingByDay = Map.groupBy(upcoming.filter((t) => t.status !== "done"), (t) => t.due_date!);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">{formatDate(today, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">Өнөөдөр</h1>
      </header>

      <QuickAddTask today={today} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Өнөөдрийн ажил" action={{ href: "/calendar", label: "Хуанли" }}>
            <TaskList tasks={todayTasks} empty="Өнөөдөр хийх ажил алга." />
          </Section>

          <Section title="Ойрын 7 хоног">
            {upcomingByDay.size === 0 ? (
              <p className="text-sm text-muted-foreground">Ирэх 7 хоног чөлөөтэй.</p>
            ) : (
              <div className="space-y-3">
                {[...upcomingByDay].map(([day, tasks]) => (
                  <div key={day}>
                    <h3 className="text-xs text-muted-foreground">{formatDate(day, { weekday: "long", month: "short", day: "numeric" })}</h3>
                    <TaskList tasks={tasks} empty="" />
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Явц">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Ажил" value={String(progress.total)} />
              <Stat label="Хийсэн" value={String(progress.done)} />
              <Stat label="Үлдсэн" value={String(progress.remaining)} />
            </div>
            <div className="mt-4 space-y-3">
              <Meter label="Өнөөдөр" value={progress.rate} />
              <Meter label="Энэ 7 хоног" value={weekProgress.rate} detail={`${weekProgress.done} / ${weekProgress.total}`} />
            </div>
          </Section>

          <Section title="Дараагийнх">
            {next.length === 0 ? (
              <p className="text-sm text-muted-foreground">Өнөөдөр хийх зүйл үлдсэнгүй.</p>
            ) : (
              <ol className="space-y-1.5 text-sm">
                {next.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <span className="text-muted-foreground">→</span>
                    <span className="flex-1 truncate">{t.title}</span>
                    {t.due_time && <span className="font-mono text-xs tabular-nums text-muted-foreground">{formatTime(t.due_time)}</span>}
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section title="Хоцорсон">
            <TaskList tasks={overdue} empty="Хоцорсон ажил алга." showDate today={today} />
          </Section>
        </div>
      </div>
    </div>
  );
}

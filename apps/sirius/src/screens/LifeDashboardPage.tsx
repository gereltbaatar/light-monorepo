import { getLifeSummary } from "@workspace/sirius-core/domains/life";
import { appUrl } from "@workspace/sirius-core/lib/apps";
import { formatDay } from "@workspace/sirius-core/lib/date";
import { formatMoney, formatPercent, ratio } from "@workspace/sirius-core/lib/format";
import { Meter } from "@workspace/sirius-core/components/Meter";
import { MonthCalendar } from "@workspace/sirius-core/components/MonthCalendar";
import { Section } from "@workspace/sirius-core/components/Section";
import { Stat } from "@workspace/sirius-core/components/Stat";

export default async function LifeDashboardPage() {
  const s = await getLifeSummary();
  const currency = s.profile?.currency ?? "MNT";
  const name = s.profile?.display_name?.split(" ")[0];
  const topCategory = s.money.topCategories[0];
  const todayWorkout = s.fit.today[0];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">
          {formatDay(s.today, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{name ? `Hi, ${name}` : "Today"}</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Section title="Do · Today" action={{ href: appUrl("do"), label: "Open" }}>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Done" value={String(s.do.today.done)} />
            <Stat label="Left" value={String(s.do.today.remaining)} />
            <Stat label="Overdue" value={String(s.do.overdue.length)} tone={s.do.overdue.length ? "expense" : "default"} />
          </div>
          <div className="mt-4">
            <Meter label="Completion" value={s.do.today.rate} color="var(--domain-do)" />
          </div>
          <ul className="mt-4 space-y-1.5 text-sm">
            {s.do.todayTasks.slice(0, 5).map((task) => (
              <li key={task.id} className={task.status === "done" ? "text-muted-foreground line-through" : ""}>
                {task.title}
              </li>
            ))}
            {s.do.todayTasks.length === 0 && <li className="text-muted-foreground">Nothing due today.</li>}
          </ul>
        </Section>

        <Section title="Fit · Today" action={{ href: appUrl("fit"), label: "Open" }}>
          <div className="text-sm">
            {todayWorkout ? (
              <>
                <span className="font-medium">{todayWorkout.title}</span>
                <span className="text-muted-foreground"> · {todayWorkout.status}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Rest day</span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Streak" value={`${s.fit.streak}d`} />
            <Stat
              label="Weight"
              value={s.fit.weight.current !== null ? `${s.fit.weight.current}kg` : "—"}
              hint={s.fit.weight.change !== null ? `${s.fit.weight.change > 0 ? "+" : ""}${s.fit.weight.change.toFixed(1)}kg / 30d` : undefined}
            />
          </div>
          <div className="mt-4">
            <Meter
              label="This month"
              value={ratio(s.fit.month.completed, s.fit.month.scheduled)}
              detail={`${s.fit.month.completed} / ${s.fit.month.scheduled}`}
              color="var(--domain-fit)"
            />
          </div>
        </Section>

        <Section title="Money · This month" action={{ href: appUrl("money"), label: "Open" }}>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="In" value={formatMoney(s.money.income, currency)} tone="income" />
            <Stat label="Out" value={formatMoney(s.money.expense, currency)} tone="expense" />
            <Stat label="Left" value={formatMoney(s.money.left, currency)} />
          </div>
          <div className="mt-4">
            <Meter
              label={topCategory ? `Top: ${topCategory.name}` : "Top category"}
              value={topCategory?.share ?? null}
              detail={topCategory ? formatMoney(topCategory.amount, currency) : "—"}
              color="var(--domain-money)"
            />
          </div>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title={formatDay(s.month.start, { month: "long", year: "numeric" })} className="lg:col-span-2">
          <MonthCalendar
            month={s.month}
            today={s.today}
            items={s.calendar}
            weekStartsOn={s.profile?.week_starts_on ?? 1}
          />
        </Section>

        <Section title="Overall">
          <div className="space-y-4">
            <Meter label="Tasks this week" value={s.do.week.rate} detail={`${s.do.week.done} / ${s.do.week.total}`} color="var(--domain-do)" />
            <Meter label="Training consistency" value={s.fit.month.consistency} color="var(--domain-fit)" />
            <Meter label="Savings rate" value={s.money.savingsRate} color="var(--domain-money)" />
          </div>
          <div className="mt-6 border-t pt-4">
            <Stat label="Total balance" value={formatMoney(s.money.balance, currency)} />
          </div>
          <ul className="mt-4 space-y-1.5 text-sm">
            {s.money.topCategories.slice(0, 4).map((c) => (
              <li key={c.name} className="flex justify-between">
                <span>{c.name}</span>
                <span className="font-mono tabular-nums text-muted-foreground">{formatPercent(c.share)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

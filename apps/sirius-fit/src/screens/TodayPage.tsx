import { getClock } from "@workspace/sirius-core/lib/auth";
import { formatDay } from "@workspace/sirius-core/lib/date";
import { ratio } from "@workspace/sirius-core/lib/format";
import { getFitSummary, getPersonalRecords } from "@workspace/sirius-core/domains/fit";
import { Meter } from "@workspace/sirius-core/components/Meter";
import { Section } from "@workspace/sirius-core/components/Section";
import { Stat } from "@workspace/sirius-core/components/Stat";

export default async function TodayPage() {
  const { today, month } = await getClock();
  const [summary, records] = await Promise.all([getFitSummary(today, month), getPersonalRecords(8)]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">{formatDay(today, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">Training</h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Today" className="lg:col-span-2">
          {summary.today.length === 0 ? (
            <p className="text-sm text-muted-foreground">Rest day — nothing scheduled.</p>
          ) : (
            <ul className="divide-y">
              {summary.today.map((w) => (
                <li key={w.id} className="flex justify-between py-2 text-sm">
                  <span className="font-medium">{w.title}</span>
                  <span className="text-muted-foreground">{w.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="This month">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Streak" value={`${summary.streak}d`} />
            <Stat
              label="Weight"
              value={summary.weight.current !== null ? `${summary.weight.current}kg` : "—"}
              hint={summary.weight.change !== null ? `${summary.weight.change > 0 ? "+" : ""}${summary.weight.change.toFixed(1)}kg / 30d` : undefined}
            />
          </div>
          <div className="mt-4 space-y-3">
            <Meter
              label="Workouts"
              value={ratio(summary.month.completed, summary.month.scheduled)}
              detail={`${summary.month.completed} / ${summary.month.scheduled}`}
            />
            <Meter label="Consistency" value={summary.month.consistency} />
          </div>
        </Section>
      </div>

      <Section title="Personal records">
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">Complete a workout with weighted sets to see records.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-2 font-normal">Exercise</th>
                <th className="pb-2 font-normal">Best set</th>
                <th className="pb-2 font-normal">Est. 1RM</th>
                <th className="pb-2 text-right font-normal">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono tabular-nums">
              {records.map((r) => (
                <tr key={r.exercise_id}>
                  <td className="py-2 font-sans">{r.exercise_name}</td>
                  <td className="py-2">{r.weight_kg}kg × {r.reps}</td>
                  <td className="py-2">{r.estimated_1rm}kg</td>
                  <td className="py-2 text-right text-muted-foreground">{formatDay(r.achieved_on, { month: "short", day: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

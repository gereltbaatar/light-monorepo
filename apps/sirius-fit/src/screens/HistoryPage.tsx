import { formatDay } from "@workspace/sirius-core/lib/date";
import { getRecentWorkouts } from "@workspace/sirius-core/domains/fit";
import { Section } from "@workspace/sirius-core/components/Section";

export default async function HistoryPage() {
  const workouts = await getRecentWorkouts(50);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">History</h1>
      <Section title="Completed workouts">
        {workouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed workouts yet.</p>
        ) : (
          <ul className="divide-y">
            {workouts.map((w) => (
              <li key={w.id} className="flex justify-between py-2 text-sm">
                <span>{w.title}</span>
                <span className="font-mono text-muted-foreground">{formatDay(w.scheduled_on, { month: "short", day: "numeric" })}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

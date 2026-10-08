import { getClock } from "@workspace/sirius-core/lib/auth";
import { formatDay } from "@workspace/sirius-core/lib/date";
import { getCalendarItems } from "@workspace/sirius-core/domains/life";
import { MonthCalendar } from "@workspace/sirius-core/components/MonthCalendar";

export default async function CalendarPage() {
  const { profile, today, month } = await getClock();
  const items = await getCalendarItems(month);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">{formatDay(month.start, { month: "long", year: "numeric" })}</h1>
      <MonthCalendar month={month} today={today} items={items} weekStartsOn={profile?.week_starts_on ?? 1} />
    </div>
  );
}

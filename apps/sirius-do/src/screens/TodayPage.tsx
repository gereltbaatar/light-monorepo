import { getClock } from "@workspace/sirius-core/lib/auth";
import type { Day } from "@workspace/sirius-core/lib/date";
import { CaptureBar } from "@/app/_components/CaptureBar";
import { DayView } from "@/app/_components/DayView";
import { getCategories } from "@/lib/tasks";

export default async function TodayPage({ day }: { day?: Day }) {
  const [{ profile, today }, categories] = await Promise.all([getClock(), getCategories()]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <DayView selected={day ?? today} today={today} weekStartsOn={profile?.week_starts_on ?? 1} />
      <CaptureBar categories={categories} day={today} />
    </div>
  );
}

import { getClock } from "@workspace/sirius-core/lib/auth";
import type { Day } from "@workspace/sirius-core/lib/date";
import { QuickAddTask } from "@/app/_components/QuickAddTask";
import { DayView } from "@/app/_components/DayView";
import { VoiceButton } from "@/app/_components/VoiceButton";
import { getCategories } from "@/lib/tasks";

export default async function TodayPage({ day, category }: { day?: Day; category?: string }) {
  const [{ profile, today }, categories] = await Promise.all([getClock(), getCategories()]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <DayView selected={day ?? today} today={today} weekStartsOn={profile?.week_starts_on ?? 1} basePath="/" category={category} />
      <div className="hidden items-start gap-3 md:flex">
        <div className="flex-1">
          <QuickAddTask today={today} defaultDate={day ?? today} categories={categories} defaultCategory={category} />
        </div>
        <VoiceButton categories={categories} wakeWord={false} className="size-9 shadow-none" />
      </div>
    </div>
  );
}

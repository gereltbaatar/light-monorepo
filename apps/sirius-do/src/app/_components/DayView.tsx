import { daysBetween, weekRange, type Day } from "@workspace/sirius-core/lib/date";
import { DayBoard } from "@/app/_components/DayBoard";
import { getCategories, getTasksDue, getUndatedOpenTasks } from "@/lib/tasks";

interface DayViewProps {
  selected: Day;
  today: Day;
  weekStartsOn: number;
}

export async function DayView({ selected, today, weekStartsOn }: DayViewProps) {
  const week = weekRange(selected, weekStartsOn);
  const [weekTasks, undated, categories] = await Promise.all([getTasksDue(week), getUndatedOpenTasks(), getCategories()]);

  return <DayBoard days={daysBetween(week)} today={today} weekTasks={weekTasks} undated={undated} categories={categories} />;
}

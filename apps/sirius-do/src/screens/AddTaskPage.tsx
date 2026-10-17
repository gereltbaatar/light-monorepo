import { getClock } from "@workspace/sirius-core/lib/auth";
import type { Day } from "@workspace/sirius-core/lib/date";
import { AddTaskForm } from "@/app/(main)/add-task/_components/AddTaskForm";
import { getCategories } from "@/lib/tasks";

export default async function AddTaskPage({ day, category }: { day?: Day; category?: string }) {
  const [{ today }, categories] = await Promise.all([getClock(), getCategories()]);
  const defaultCategory = categories.some((c) => c.id === category) ? category : undefined;

  return <AddTaskForm today={today} categories={categories} defaultDate={day ?? today} defaultCategory={defaultCategory} />;
}

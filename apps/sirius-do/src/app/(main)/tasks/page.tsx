import TasksPage, { type TaskFilter } from "@/screens/TasksPage";

const FILTERS: TaskFilter[] = ["open", "done", "all"];

export default async function Tasks({ searchParams }: { searchParams: Promise<{ filter?: string; day?: string; cat?: string }> }) {
  const { filter, day, cat } = await searchParams;
  return (
    <TasksPage
      filter={FILTERS.find((f) => f === filter) ?? "open"}
      day={day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined}
      category={cat && /^[0-9a-f-]{36}$/i.test(cat) ? cat : undefined}
    />
  );
}

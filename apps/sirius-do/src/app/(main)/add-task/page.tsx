import AddTaskPage from "@/screens/AddTaskPage";

export default async function AddTask({ searchParams }: { searchParams: Promise<{ day?: string; cat?: string }> }) {
  const { day, cat } = await searchParams;
  return (
    <AddTaskPage
      day={day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined}
      category={cat && /^[0-9a-f-]{36}$/i.test(cat) ? cat : undefined}
    />
  );
}

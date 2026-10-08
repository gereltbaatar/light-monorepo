import CalendarPage from "@/screens/CalendarPage";

export default async function Calendar({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
  const { view, date } = await searchParams;
  return <CalendarPage view={view === "month" ? "month" : "week"} date={date} />;
}

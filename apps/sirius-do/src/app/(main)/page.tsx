import TodayPage from "@/screens/TodayPage";

export default async function Home({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { day } = await searchParams;
  return <TodayPage day={day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined} />;
}

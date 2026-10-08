import LoginPage from "@/screens/LoginPage";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return <LoginPage next={next} error={error} />;
}

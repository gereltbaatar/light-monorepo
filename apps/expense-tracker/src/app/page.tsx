import { Bank, GoalsBudgets, TotalBalance } from "@/components/home";
import { BottomNav, Header } from "@/components/navigation";

export default function Home() {
  return (
    <div className="w-full max-w-[430px] mx-auto pb-24">
      <Header />
      <TotalBalance />
      <Bank />
      <GoalsBudgets />
      <BottomNav />
    </div>
  );
}

import { Bank, GoalsBudgets, TotalBalance } from "@/components/home";
import { Header } from "@/components/navigation";

export default function Home() {
  return (
    <div className="w-full max-w-[430px] mx-auto">
      <Header />
      <TotalBalance />
      <Bank />
      <GoalsBudgets />
    </div>
  );
}

import { Bank, Goals, TotalBalance, Transactions } from "@/components/home";
import { BottomNav, Header } from "@/components/navigation";

const HomePage = () => {
  return (
    <div className="w-full max-w-[430px] mx-auto pb-24">
      <Header />
      <TotalBalance />
      <Bank />
      <Goals />
      <Transactions />
      <BottomNav />
    </div>
  );
};

export default HomePage;

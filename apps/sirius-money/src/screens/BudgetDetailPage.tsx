import { notFound } from "next/navigation";
import { getBudget, getBudgetExpenses } from "@/lib/budgets";
import { BudgetDetail } from "@/app/budgets/[id]/_components/BudgetDetail";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BudgetDetailPage = async ({ id }: { id: string }) => {
    if (!UUID_PATTERN.test(id)) notFound();

    const budget = await getBudget(id);
    if (!budget) notFound();
    const expenses = await getBudgetExpenses(budget);

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="max-w-[430px] mx-auto">
                <BudgetDetail budget={budget} expenses={expenses} />
            </div>
        </div>
    );
};

export default BudgetDetailPage;

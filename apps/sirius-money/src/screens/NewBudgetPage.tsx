import { NewBudgetForm } from "@/app/budgets/new/_components/NewBudgetForm";
import { getPreferredCurrencies } from "@/lib/currency-settings";
import { getExchangeRates } from "@/lib/exchange-rates";

const NewBudgetPage = async () => {
    const [allRates, preferred] = await Promise.all([
        getExchangeRates(),
        getPreferredCurrencies(),
    ]);
    const rates = allRates && {
        date: allRates.date,
        rates: allRates.rates.filter((rate) => preferred.includes(rate.code)),
    };

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="max-w-[430px] mx-auto">
                <NewBudgetForm rates={rates} />
            </div>
        </div>
    );
};

export default NewBudgetPage;

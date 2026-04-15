import { ArrowDownCircle, ArrowUpCircle, TrendingDown, TrendingUp } from "lucide-react";
import { moneyFormatter } from "../functions";

export const TotalBalance = () => {
    return (
        <div className="w-full px-4 pb-4 flex gap-4">
            <div className="flex-1">
                {/* Total balance label */}
                <p className="text-base font-semibold text-[#a6a6a6] tracking-tight mb-2">
                    Total balance
                </p>

                {/* Main balance amount */}
                <h1 className="text-3xl font-bold text-[#090909] tracking-tight mb-3">
                    {moneyFormatter(2300000)}
                </h1>

                {/* Change indicator */}
                <div className="flex items-center gap-1.5">
                    <span className="text-green-500 text-sm">▲</span>
                    <span className="text-green-500 text-sm font-semibold">
                        {moneyFormatter(4900)}(49.9%)
                    </span>
                </div>
            </div>

            {/* Income & Expense Cards */}
            <div className="flex flex-col gap-3">
                {/* Income Card */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-3xl">
                    <TrendingUp className="w-5 h-5 text-green-600" strokeWidth={2} />
                    <div>
                        <p className="text-sm text-green-700 font-medium">
                            Income
                        </p>
                        <p className="text-base font-bold text-green-600">
                            {moneyFormatter(3500000)}
                        </p>
                    </div>
                </div>

                {/* Expense Card */}
                <div className="flex items-center gap-2  px-3 py-2 rounded-3xl">
                    <TrendingDown className="w-5 h-5 text-red-600" strokeWidth={2} />
                    <div>
                        <p className="text-sm text-red-700 font-medium">
                            Expense
                        </p>
                        <p className="text-base font-bold text-red-600">
                            {moneyFormatter(1200000)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

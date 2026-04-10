import { ArrowDown, ArrowUp } from "lucide-react";
import { TransactionsCardProps } from "./type";
import { moneyFormatter } from "../functions";

export const TransactionsCard = ({ transactionType, title, amount, timestamp }: TransactionsCardProps) => {
    // Extract time from timestamp (HH:MM format)
    const time = new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    return (
        <div className="w-full rounded-[60px] bg-[#F8F9FA] p-2.5">
            <div className="flex items-center gap-4">
                {/* icon */}
                <div
                    className={`w-12 h-12 rounded-full bg-white flex items-center justify-center `}
                    style={{ backgroundColor: transactionType === "income" ? "#e6fbe6" : "#fde6e6" }}
                >
                    {transactionType === "income" ? (
                        <ArrowDown className="w-6 h-6 text-[#00b102]" />
                    ) : (
                        <ArrowUp className="w-6 h-6 text-[#ff0000]" />
                    )}
                </div>

                {/* title */}
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-bold text-[#1C1C1E]">{title}</h1>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-md font-bold" style={{ color: transactionType === "income" ? "#00b102" : "#ff0000" }}>
                            {transactionType === "income" ? "+" : "-"} {moneyFormatter(Number(amount))}
                        </p>
                        <p className="text-sm font-semibold text-[#8E8E93] pr-2">{time}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
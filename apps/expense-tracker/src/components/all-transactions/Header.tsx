import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AllTransactionsProps } from "./type";

export const Header = ({ count }: AllTransactionsProps) => {
    return (
        <div className="sticky top-0 bg-white z-40 px-4 py-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
                <Link
                    href="/"
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-[#1C1C1E]" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[#1C1C1E]">
                        All Transactions
                    </h1>
                    <p className="text-sm text-[#8E8E93]">
                        {count} transactions
                    </p>
                </div>
            </div>
        </div>
    )
}
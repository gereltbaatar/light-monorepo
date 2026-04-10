import Link from "next/link";
import { TransactionsCard } from "./TransactionsCard";
import { TransactionsCardProps } from "./type";

// Helper to generate dynamic dates (today, yesterday, 2 days ago)
const getTodayTimestamp = (hours: number, minutes: number): string => {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
};

const getYesterdayTimestamp = (hours: number, minutes: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
};

const getTwoDaysAgoTimestamp = (hours: number, minutes: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - 2);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
};

// Mock transaction data (last 3 days with dynamic dates)
const mockTransactions: TransactionsCardProps[] = [
    // Today
    {
        transactionType: "expense",
        title: "Grocery Shopping",
        amount: "12450",
        timestamp: getTodayTimestamp(14, 30)
    },
    {
        transactionType: "expense",
        title: "Coffee & Snacks",
        amount: "3500",
        timestamp: getTodayTimestamp(16, 45)
    },
    // Yesterday
    {
        transactionType: "income",
        title: "Salary Payment",
        amount: "450000",
        timestamp: getYesterdayTimestamp(9, 0)
    },
    {
        transactionType: "expense",
        title: "Uber Ride",
        amount: "8200",
        timestamp: getYesterdayTimestamp(18, 20)
    },
    // 2 days ago
    {
        transactionType: "income",
        title: "Freelance Work",
        amount: "75000",
        timestamp: getTwoDaysAgoTimestamp(11, 15)
    },
    {
        transactionType: "expense",
        title: "Restaurant Dinner",
        amount: "18500",
        timestamp: getTwoDaysAgoTimestamp(19, 30)
    }
];

// Helper function to format date label
const getDateLabel = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to midnight for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
        return "Today";
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
        return "Yesterday";
    } else {
        // Format as "Jan 15, 2024"
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
};

// Group transactions by date
const groupTransactionsByDate = (transactions: TransactionsCardProps[]) => {
    const grouped: { [key: string]: TransactionsCardProps[] } = {};

    transactions.forEach((transaction) => {
        const dateLabel = getDateLabel(transaction.timestamp);
        if (!grouped[dateLabel]) {
            grouped[dateLabel] = [];
        }
        grouped[dateLabel].push(transaction);
    });

    return grouped;
};

export const Transactions = () => {
    const groupedTransactions = groupTransactionsByDate(mockTransactions);

    return (
        <div className="px-4 pb-6">
            <div className="flex items-center justify-between mb-4">
                {/* title */}
                <h1 className="text-2xl font-bold text-[#1C1C1E]">Transactions</h1>

                {/* see all button */}
                <Link
                    href="/all-transactions"
                    className="text-[#1C1C1E] font-medium hover:text-[#1C1C1E]/80 transition-colors"
                >
                    See all
                </Link>
            </div>

            {/* transactions grouped by date */}
            <div className="flex flex-col gap-6">
                {Object.entries(groupedTransactions).map(([dateLabel, transactions]) => (
                    <div key={dateLabel} className="flex flex-col gap-3">
                        {/* Date header */}
                        <h2 className="text-sm font-semibold text-[#8E8E93] uppercase tracking-wide">
                            {dateLabel}
                        </h2>

                        {/* Transactions for this date */}
                        <div className="flex flex-col gap-3">
                            {transactions.map((transaction, index) => (
                                <TransactionsCard
                                    key={`${dateLabel}-${index}`}
                                    transactionType={transaction.transactionType}
                                    title={transaction.title}
                                    amount={transaction.amount}
                                    timestamp={transaction.timestamp}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

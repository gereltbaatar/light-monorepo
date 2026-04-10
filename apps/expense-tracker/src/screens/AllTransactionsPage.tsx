"use client";

import { TransactionsCard } from "@/components/home/TransactionsCard";
import { TransactionsCardProps } from "@/components/home/type";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Header } from "@/components/all-transactions";

// Helper to generate dynamic dates
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

const getDaysAgoTimestamp = (daysAgo: number, hours: number, minutes: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
};

// All transactions mock data
const allTransactions: TransactionsCardProps[] = [
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
        timestamp: getDaysAgoTimestamp(2, 11, 15)
    },
    {
        transactionType: "expense",
        title: "Restaurant Dinner",
        amount: "18500",
        timestamp: getDaysAgoTimestamp(2, 19, 30)
    },
    // 3 days ago
    {
        transactionType: "expense",
        title: "Netflix Subscription",
        amount: "9900",
        timestamp: getDaysAgoTimestamp(3, 0, 1)
    },
    {
        transactionType: "expense",
        title: "Gas Station",
        amount: "15000",
        timestamp: getDaysAgoTimestamp(3, 8, 45)
    },
    // 4 days ago
    {
        transactionType: "income",
        title: "Bonus Payment",
        amount: "50000",
        timestamp: getDaysAgoTimestamp(4, 10, 0)
    },
    {
        transactionType: "expense",
        title: "Pharmacy",
        amount: "6800",
        timestamp: getDaysAgoTimestamp(4, 15, 20)
    },
    // 5 days ago
    {
        transactionType: "expense",
        title: "Online Shopping",
        amount: "25000",
        timestamp: getDaysAgoTimestamp(5, 13, 0)
    },
    {
        transactionType: "income",
        title: "Refund",
        amount: "5000",
        timestamp: getDaysAgoTimestamp(5, 16, 30)
    },
    // 6 days ago
    {
        transactionType: "expense",
        title: "Movie Tickets",
        amount: "12000",
        timestamp: getDaysAgoTimestamp(6, 19, 0)
    },
    {
        transactionType: "expense",
        title: "Taxi",
        amount: "4500",
        timestamp: getDaysAgoTimestamp(6, 22, 15)
    }
];

// Helper function to format date label
const getDateLabel = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
        return "Today";
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
        return "Yesterday";
    } else {
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


const AllTransactionsPage = () => {
    const groupedTransactions = groupTransactionsByDate(allTransactions);

    return (
        <div className="min-h-screen bg-white pb-32">
            <div className="max-w-[430px] mx-auto">
                <Header count={allTransactions.length} />

                {/* Transactions grouped by date */}
                <div className="px-4 py-6">
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
            </div>

            <BottomNav />
        </div>
    );
};

export default AllTransactionsPage;
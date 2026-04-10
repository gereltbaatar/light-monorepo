export interface TransactionsCardProps {
    transactionType: "income" | "expense";
    title: string;
    amount: string;
    timestamp: string; // ISO 8601 datetime string from database
}
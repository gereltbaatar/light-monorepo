import type { Category } from "@/lib/categories";

export interface TransactionsCardProps {
    id: string;
    transactionType: "income" | "expense";
    title: string;
    amount: string;
    timestamp: string; // ISO 8601 datetime string from database
    category?: Category;
    onEdit?: () => void;
    onDelete?: () => void;
    onOpen?: () => void;

    /** Identifier used by the parent to track which card is open. */
    cardId?: string;
    /** When true, the card is held open showing its action buttons. */
    isOpen?: boolean;
    /** Called when the user swipes this card open. */
    onSwipeOpen?: (cardId: string) => void;
    /** Called when the user swipes this card closed. */
    onSwipeClose?: () => void;
}
export interface TransactionsCardProps {
    transactionType: "income" | "expense";
    title: string;
    amount: string;
    timestamp: string; // ISO 8601 datetime string from database
    onEdit?: () => void;
    onDelete?: () => void;

    /** Identifier used by the parent to track which card is open. */
    cardId?: string;
    /** When true, the card is held open showing its action buttons. */
    isOpen?: boolean;
    /** Called when the user swipes this card open. */
    onSwipeOpen?: (cardId: string) => void;
    /** Called when the user swipes this card closed. */
    onSwipeClose?: () => void;
}
export const inputClass =
    "h-12 px-4 rounded-2xl bg-surface text-foreground placeholder:text-muted-foreground/70 border-border";

export const selectClass =
    "h-12 w-full px-4 rounded-2xl bg-surface text-foreground border border-border outline-none";

export const labelClass = "text-sm text-muted-foreground";

export const submitButtonClass =
    "w-full rounded-full py-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90";

export interface BudgetFormProps {
    onSubmitDone: () => void;
}

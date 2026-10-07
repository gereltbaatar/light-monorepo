"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Minus, PiggyBank, Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Progress } from "@workspace/ui/components/progress";
import { Separator } from "@workspace/ui/components/separator";
import { moneyFormatter } from "@/components/functions";
import { goalPercent } from "@/components/home/GoalCard";
import { addContribution, deleteGoal } from "@/app/_actions/goals";
import type { Goal, GoalContribution } from "@/lib/goals";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { useLocale, useT } from "@/lib/i18n/client";
import { goalsDict } from "@/lib/i18n/dictionaries/goals";

const formatDate = (value: string, locale: Locale) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(INTL_LOCALE[locale], {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

export const GoalDetail = ({
    goal,
    contributions,
}: {
    goal: Goal;
    contributions: GoalContribution[];
}) => {
    const t = useT(goalsDict);
    const locale = useLocale();
    const router = useRouter();
    const [direction, setDirection] = useState<"deposit" | "withdrawal" | null>(null);
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const percent = goalPercent(goal);
    const remaining = Math.max(0, goal.target_amount - goal.saved_amount);

    const openDialog = (next: "deposit" | "withdrawal") => {
        setAmount("");
        setNote("");
        setDirection(next);
    };

    const handleContribute = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!direction) return;
        setIsSaving(true);
        try {
            const result = await addContribution(goal.id, {
                amount: Number(amount),
                direction,
                note,
            });
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(direction === "deposit" ? t.addedToGoal : t.withdrawnFromGoal);
            setDirection(null);
            router.refresh();
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteGoal(goal.id);
        if ("error" in result) {
            toast.error(result.error);
            setIsDeleting(false);
            return;
        }
        toast.success(t.goalDeleted);
        router.replace("/");
        router.refresh();
    };

    return (
        <>
            <div className="relative h-[260px] w-full bg-surface-2">
                {goal.image_url ? (
                    <Image
                        src={goal.image_url}
                        alt={goal.title}
                        fill
                        priority
                        sizes="430px"
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <PiggyBank className="h-16 w-16 text-muted-foreground" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={() => router.back()}
                    className="absolute left-4 top-4 h-10 w-10 rounded-full bg-white/90 text-black hover:bg-white"
                    aria-label={t.back}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center gap-2 pb-1">
                        <Badge variant="secondary" className="capitalize">
                            {goal.kind === "plan" ? t.plan : (t.categories[goal.category] ?? goal.category)}
                        </Badge>
                        {goal.status === "completed" && (
                            <Badge className="bg-success text-white">{t.completed}</Badge>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{goal.title}</h1>
                </div>
            </div>

            <div className="px-4 pt-5 space-y-5">
                <Card className="rounded-3xl border border-transparent bg-surface shadow-none dark:border-border">
                    <CardContent className="p-5 space-y-3">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t.saved}</p>
                                <p className="text-3xl font-bold text-foreground">
                                    {moneyFormatter(goal.saved_amount)}
                                </p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{percent}%</p>
                        </div>
                        <Progress value={percent} className="h-2.5 bg-foreground/10" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{t.target(moneyFormatter(goal.target_amount))}</span>
                            <span>{t.toGo(moneyFormatter(remaining))}</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        type="button"
                        onClick={() => openDialog("deposit")}
                        className="h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" /> {t.addMoney}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => openDialog("withdrawal")}
                        disabled={goal.saved_amount <= 0}
                        className="h-12 rounded-full"
                    >
                        <Minus className="h-4 w-4" /> {t.withdraw}
                    </Button>
                </div>

                {(goal.target_date || goal.kind === "plan") && (
                    <Card className="rounded-3xl border border-transparent bg-surface shadow-none dark:border-border">
                        <CardContent className="p-0">
                            {goal.target_date && (
                                <InfoRow label={t.targetDate} value={formatDate(goal.target_date, locale)} />
                            )}
                            {goal.kind === "plan" && goal.contribution_amount && goal.contribution_period && (
                                <>
                                    {goal.target_date && <Separator />}
                                    <InfoRow
                                        label={t.plan}
                                        value={`${moneyFormatter(goal.contribution_amount)} / ${t.periodUnit[goal.contribution_period]}`}
                                    />
                                </>
                            )}
                            {goal.kind === "plan" && goal.start_date && (
                                <>
                                    <Separator />
                                    <InfoRow label={t.started} value={formatDate(goal.start_date, locale)} />
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t.history}</p>
                    {contributions.length === 0 ? (
                        <p className="rounded-3xl border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">
                            {t.noContributions}
                        </p>
                    ) : (
                        <Card className="rounded-3xl border border-transparent bg-surface shadow-none dark:border-border">
                            <CardContent className="p-0">
                                {contributions.map((c, index) => (
                                    <div key={c.id}>
                                        {index > 0 && <Separator />}
                                        <div className="flex items-center justify-between gap-4 px-5 py-4">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {c.note || (c.direction === "deposit" ? t.deposit : t.withdrawal)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(c.contributed_on, locale)}
                                                </p>
                                            </div>
                                            <p
                                                className={`shrink-0 text-sm font-bold ${c.direction === "deposit" ? "text-income" : "text-expense"}`}
                                            >
                                                {c.direction === "deposit" ? "+" : "-"} {moneyFormatter(c.amount)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-12 w-full rounded-full bg-expense-soft text-expense hover:bg-expense-soft/80 hover:text-expense"
                        >
                            <Trash2 className="h-4 w-4" /> {t.deleteGoal}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[360px] rounded-3xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t.deleteConfirmTitle(goal.title)}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t.deleteConfirmBody}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="rounded-full bg-expense text-white hover:bg-expense/90"
                            >
                                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {t.delete}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <Dialog open={direction !== null} onOpenChange={(open) => !open && setDirection(null)}>
                <DialogContent className="max-w-[360px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {direction === "withdrawal" ? t.withdrawTitle : t.depositTitle}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleContribute} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="contribution-amount" className="text-sm text-muted-foreground">
                                {t.amount}
                            </Label>
                            <Input
                                id="contribution-amount"
                                type="number"
                                inputMode="decimal"
                                min={1}
                                max={direction === "withdrawal" ? goal.saved_amount : undefined}
                                required
                                autoFocus
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={goal.contribution_amount ? String(goal.contribution_amount) : "100000"}
                                className="h-12 rounded-2xl bg-surface"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contribution-note" className="text-sm text-muted-foreground">
                                {t.noteOptional}
                            </Label>
                            <Input
                                id="contribution-note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                maxLength={120}
                                placeholder={t.notePlaceholder}
                                className="h-12 rounded-2xl bg-surface"
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="h-12 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                {direction === "withdrawal" ? t.withdraw : t.add}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground text-right">{value}</span>
    </div>
);

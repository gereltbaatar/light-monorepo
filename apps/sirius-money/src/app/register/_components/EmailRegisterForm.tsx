"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { authDict } from "@/lib/i18n/dictionaries/auth";
import { signUpWithEmail, type AuthActionResult } from "@/app/_actions/auth";

export const EmailRegisterForm = () => {
    const t = useT(authDict);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [clientErrors, setClientErrors] = useState({ email: "", password: "" });

    const [state, formAction, isPending] = useActionState<AuthActionResult, FormData>(
        signUpWithEmail,
        undefined
    );

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error);
        }
    }, [state]);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        const newErrors = { email: "", password: "" };

        if (!email) {
            newErrors.email = t.emailRequired;
        } else if (!validateEmail(email)) {
            newErrors.email = t.emailInvalid;
        }

        if (!password) {
            newErrors.password = t.passwordRequired;
        } else if (password.length < 6) {
            newErrors.password = t.passwordTooShort;
        }

        setClientErrors(newErrors);

        if (newErrors.email || newErrors.password) {
            e.preventDefault();
        }
    };

    return (
        <div className="w-full max-w-md mx-auto px-6">
            <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setClientErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        placeholder={t.emailPlaceholder}
                        className={cn(
                            "h-12 px-4 rounded-full",
                            "bg-surface text-foreground placeholder:text-muted-foreground",
                            "border-border focus:border-ring",
                            "focus:ring-ring/50",
                            clientErrors.email && "border-destructive focus:border-destructive focus:ring-destructive/50"
                        )}
                    />
                    {clientErrors.email && (
                        <p className="text-sm text-destructive">{clientErrors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setClientErrors((prev) => ({ ...prev, password: "" }));
                            }}
                            placeholder={t.newPasswordPlaceholder}
                            className={cn(
                                "h-12 px-4 pr-12 rounded-full",
                                "bg-surface text-foreground placeholder:text-muted-foreground",
                                "border-border focus:border-ring",
                                "focus:ring-ring/50",
                                clientErrors.password && "border-destructive focus:border-destructive focus:ring-destructive/50"
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    {clientErrors.password && (
                        <p className="text-sm text-destructive">{clientErrors.password}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={isPending}
                    className={cn(
                        "w-full rounded-full py-6 text-base font-semibold",
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                        "disabled:opacity-60"
                    )}
                >
                    {isPending ? t.creatingAccount : t.createAccount}
                </Button>
            </form>
        </div>
    );
};

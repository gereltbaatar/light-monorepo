"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { signUpWithEmail, type AuthActionResult } from "@/app/_actions/auth";

export const EmailRegisterForm = () => {
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
            newErrors.email = "Email is required";
        } else if (!validateEmail(email)) {
            newErrors.email = "Please enter a valid email";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
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
                        placeholder="Enter your email"
                        className={cn(
                            "h-12 px-4 rounded-full",
                            "bg-[#1C1C1E] text-white placeholder:text-gray-500",
                            "border-gray-700 focus:border-gray-500",
                            "focus:ring-gray-600/50",
                            clientErrors.email && "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                        )}
                    />
                    {clientErrors.email && (
                        <p className="text-sm text-red-500">{clientErrors.email}</p>
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
                            placeholder="Create a password (6+ chars)"
                            className={cn(
                                "h-12 px-4 pr-12 rounded-full",
                                "bg-[#1C1C1E] text-white placeholder:text-gray-500",
                                "border-gray-700 focus:border-gray-500",
                                "focus:ring-gray-600/50",
                                clientErrors.password && "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    {clientErrors.password && (
                        <p className="text-sm text-red-500">{clientErrors.password}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={isPending}
                    className={cn(
                        "w-full rounded-full py-6 text-base font-semibold",
                        "bg-white text-black hover:bg-gray-100",
                        "disabled:opacity-60"
                    )}
                >
                    {isPending ? "Creating account…" : "Create Account"}
                </Button>
            </form>
        </div>
    );
};

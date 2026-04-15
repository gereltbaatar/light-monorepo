"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface EmailLoginFormProps {
    onSubmit?: (email: string, password: string) => void;
}

export const EmailLoginForm = ({ onSubmit }: EmailLoginFormProps) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({ email: "", password: "" });

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

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

        setErrors(newErrors);

        if (!newErrors.email && !newErrors.password) {
            onSubmit?.(email, password);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setErrors(prev => ({ ...prev, email: "" }));
                        }}
                        placeholder="Enter your email"
                        className={cn(
                            "h-12 px-4 rounded-full",
                            "bg-[#1C1C1E] text-white placeholder:text-gray-500",
                            "border-gray-700 focus:border-gray-500",
                            "focus:ring-gray-600/50",
                            errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                        )}
                    />
                    {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors(prev => ({ ...prev, password: "" }));
                            }}
                            placeholder="Enter your password"
                            className={cn(
                                "h-12 px-4 pr-12 rounded-full",
                                "bg-[#1C1C1E] text-white placeholder:text-gray-500",
                                "border-gray-700 focus:border-gray-500",
                                "focus:ring-gray-600/50",
                                errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500/50"
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
                    {errors.password && (
                        <p className="text-sm text-red-500">{errors.password}</p>
                    )}
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className={cn(
                        "w-full rounded-full py-6 text-base font-semibold",
                        "bg-white text-black hover:bg-gray-100"
                    )}
                >
                    Continue
                </Button>
            </form>
        </div>
    );
};

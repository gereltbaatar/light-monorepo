"use client";

import { Button } from "@/components/ui/button";
import { GoogleSvg } from "@/components/ui/svg";
import { cn } from "@/lib/utils";

interface GoogleLoginFormProps {
    onGoogleLogin?: () => void;
}

export const GoogleLoginForm = ({ onGoogleLogin }: GoogleLoginFormProps) => {
    return (
        <div className="w-full max-w-md mx-auto px-6">
            <div className="space-y-6">
                {/* Info Text */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">
                        Sign in with Google
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Continue with your Google account
                    </p>
                </div>

                {/* Google Sign In Button */}
                <Button
                    onClick={onGoogleLogin}
                    className={cn(
                        "w-full rounded-full py-6 text-base font-semibold",
                        "bg-white text-black hover:bg-gray-100",
                        "flex items-center justify-center gap-3"
                    )}
                >
                    <GoogleSvg size={24} />
                    Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-black text-gray-400">
                            or
                        </span>
                    </div>
                </div>

                {/* Alternative Login Link */}
                <div className="text-center">
                    <a
                        href="/login?provider=email"
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Sign in with email instead
                    </a>
                </div>
            </div>
        </div>
    );
};

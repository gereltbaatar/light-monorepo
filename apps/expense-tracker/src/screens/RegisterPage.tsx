"use client";

import { Suspense, useTransition } from "react";
import { toast } from "sonner";
import EvilEye from "@/components/EvilEye";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoogleSvg } from "@/components/ui/svg";
import { cn } from "@/lib/utils";
import { EmailRegisterForm } from "@/app/register/_components";
import { signInWithGoogle } from "@/app/_actions/auth";

function RegisterContent() {
    const [isOAuthPending, startOAuth] = useTransition();

    const handleGoogleLogin = () => {
        startOAuth(async () => {
            const result = await signInWithGoogle();
            if (result?.error) {
                toast.error(result.error);
            }
        });
    };

    return (
        <div className="relative w-full min-h-screen max-w-[430px] mx-auto bg-black text-white flex flex-col">
            <div className="absolute top-20 left-0 right-0 flex items-center justify-center">
                <div className="w-full h-96 relative">
                    <EvilEye
                        eyeColor="#FF6F37"
                        intensity={1.5}
                        pupilSize={0.6}
                        irisWidth={0.25}
                        glowIntensity={0.4}
                        scale={0.65}
                        noiseScale={1}
                        pupilFollow={1}
                        flameSpeed={1}
                        backgroundColor="#000000"
                    />
                </div>
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <div className="flex-1"></div>

                <div className="pb-16">
                    <div className="text-center mb-12 px-6">
                        <h1 className="text-5xl font-bold mb-2">Sign Up</h1>
                        <p className="text-gray-400 text-sm">
                            Create an account to get started
                        </p>
                    </div>

                    <EmailRegisterForm />

                    <div className="w-full max-w-md mx-auto px-4 mt-3">
                        <Button
                            onClick={handleGoogleLogin}
                            disabled={isOAuthPending}
                            className={cn(
                                "w-full rounded-full py-6 text-base font-semibold",
                                "bg-[#2C2C2E] text-white hover:bg-[#3A3A3C]",
                                "disabled:opacity-60"
                            )}
                        >
                            <GoogleSvg size={24} />
                            {isOAuthPending ? "Redirecting…" : "Continue with Google"}
                        </Button>
                    </div>

                    <div className="text-center mt-8 px-6">
                        <p className="text-gray-400 text-sm">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-white font-semibold hover:underline transition-all"
                            >
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <RegisterContent />
        </Suspense>
    );
}

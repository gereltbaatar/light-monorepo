"use client";

import { Suspense, useTransition } from "react";
import { toast } from "@/lib/toast";
import EvilEye from "@/components/EvilEye";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoogleSvg } from "@/components/ui/svg";
import { cn } from "@/lib/utils";
import { EmailRegisterForm } from "@/app/register/_components";
import { signInWithGoogle } from "@/app/_actions/auth";
import { useT } from "@/lib/i18n/client";
import { authDict } from "@/lib/i18n/dictionaries/auth";

function RegisterContent() {
    const t = useT(authDict);
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
        <div className="relative w-full min-h-screen max-w-[430px] mx-auto bg-background text-foreground flex flex-col">
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
                    />
                </div>
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <div className="flex-1"></div>

                <div className="pb-16">
                    <div className="text-center mb-12 px-6">
                        <h1 className="text-5xl font-bold mb-2">{t.signUp}</h1>
                        <p className="text-muted-foreground text-sm">
                            {t.createToStart}
                        </p>
                    </div>

                    <EmailRegisterForm />

                    <div className="w-full max-w-md mx-auto px-4 mt-3">
                        <Button
                            onClick={handleGoogleLogin}
                            disabled={isOAuthPending}
                            className={cn(
                                "w-full rounded-full py-6 text-base font-semibold",
                                "bg-surface-2 text-foreground hover:bg-surface-2/80",
                                "disabled:opacity-60"
                            )}
                        >
                            <GoogleSvg size={24} />
                            {isOAuthPending ? t.redirecting : t.continueWithGoogle}
                        </Button>
                    </div>

                    <div className="text-center mt-8 px-6">
                        <p className="text-muted-foreground text-sm">
                            {t.haveAccount}{" "}
                            <Link
                                href="/login"
                                className="text-foreground font-semibold hover:underline transition-all"
                            >
                                {t.signIn}
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
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <RegisterContent />
        </Suspense>
    );
}

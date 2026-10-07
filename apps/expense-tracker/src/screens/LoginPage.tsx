"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useTransition } from "react";
import { toast } from "@/lib/toast";
import EvilEye from "@/components/EvilEye";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoogleSvg } from "@/components/ui/svg";
import { cn } from "@/lib/utils";
import { EmailLoginForm } from "@/app/login/_components";
import { signInWithGoogle } from "@/app/_actions/auth";
import { useT } from "@/lib/i18n/client";
import { authDict } from "@/lib/i18n/dictionaries/auth";

function LoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useT(authDict);
    const provider = searchParams.get("provider");
    const oauthError = searchParams.get("error");
    const [isOAuthPending, startOAuth] = useTransition();

    useEffect(() => {
        if (oauthError) {
            toast.error(t.signInFailed);
            const url = new URL(window.location.href);
            url.searchParams.delete("error");
            router.replace(url.pathname + url.search);
        }
    }, [oauthError, router, t]);

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

            {/* Evil Eye Background */}
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

            {/* Main Content */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Bottom Content */}
                <div className="pb-16">
                    {/* Title */}
                    <div className="text-center mb-12 px-6">
                        <h1 className="text-5xl font-bold mb-2">
                            {provider === "email" ? t.signIn : t.welcome}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {provider === "email"
                                ? t.enterCredentials
                                : t.chooseMethod}
                        </p>
                    </div>

                    {/* Login Forms */}
                    {provider === "email" ? (
                        <EmailLoginForm />
                    ) : (
                        <div className="w-full max-w-md mx-auto px-4 space-y-3">
                            <Button
                                onClick={() => router.push("/login?provider=email")}
                                className={cn(
                                    "w-full rounded-full py-6 text-base font-semibold",
                                    "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                            >
                                {t.continueWithEmail}
                            </Button>

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
                    )}

                    {/* Footer Links */}
                    <div className="text-center mt-8 px-6">
                        <p className="text-muted-foreground text-sm">
                            {t.noAccount}{" "}
                            <Link
                                href="/register"
                                className="text-foreground font-semibold hover:underline transition-all"
                            >
                                {t.signUp}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <LoginContent />
        </Suspense>
    );
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import EvilEye from "@/components/EvilEye";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoogleSvg } from "@/components/ui/svg";
import { cn } from "@/lib/utils";
import { EmailLoginForm } from "@/app/login/_components";

function LoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const provider = searchParams.get("provider");

    const handleEmailSubmit = (email: string, password: string) => {
        console.log("Email login:", { email, password });
        // TODO: Implement actual login logic
        // Example: await signIn(email, password)
    };

    const handleGoogleLogin = () => {
        console.log("Google login initiated");
        // TODO: Implement Google OAuth logic
        // Example: await signInWithGoogle()
    };

    return (
        <div className="relative w-full min-h-screen max-w-[430px] mx-auto bg-black text-white flex flex-col">

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
                        backgroundColor="#000000"
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
                            {provider === "email" ? "Sign In" : "Welcome"}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {provider === "email"
                                ? "Enter your credentials to continue"
                                : "Choose your preferred sign-in method"}
                        </p>
                    </div>

                    {/* Login Forms */}
                    {provider === "email" ? (
                        <EmailLoginForm onSubmit={handleEmailSubmit} />
                    ) : (
                        <div className="w-full max-w-md mx-auto px-4 space-y-3">
                            <Button
                                onClick={() => router.push("/login?provider=email")}
                                className={cn(
                                    "w-full rounded-full py-6 text-base font-semibold",
                                    "bg-white text-black hover:bg-gray-100"
                                )}
                            >
                                Continue with Email
                            </Button>

                            <Button
                                onClick={handleGoogleLogin}
                                className={cn(
                                    "w-full rounded-full py-6 text-base font-semibold",
                                    "bg-[#2C2C2E] text-white hover:bg-[#3A3A3C]"
                                )}
                            >
                                <GoogleSvg size={24} />
                                Continue with Google
                            </Button>
                        </div>
                    )}

                    {/* Footer Links */}
                    <div className="text-center mt-8 px-6">
                        <p className="text-gray-400 text-sm">
                            Don't have an account?{" "}
                            <Link
                                href="/register"
                                className="text-white font-semibold hover:underline transition-all"
                            >
                                Sign Up
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
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <LoginContent />
        </Suspense>
    );
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useTransition } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { GoogleSvg } from "@/components/ui/svg";
import { EmailLoginForm } from "@/app/login/_components";
import { StarsArt } from "@/app/login/_components/StarsArt";
import { signInWithGoogle } from "@/app/_actions/auth";
import { useT } from "@/lib/i18n/client";
import { authDict } from "@/lib/i18n/dictionaries/auth";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useT(authDict);
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
    <main className="dark relative flex min-h-screen flex-1 overflow-hidden bg-background text-foreground">
      <StarsArt />
      <div className="relative z-10 mx-auto flex w-full max-w-[1460px] items-center justify-center px-4 py-12">
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-center gap-3">
            <svg viewBox="150 66 355 662" className="h-20 w-auto" aria-hidden>
              <path
                transform="translate(0 762) scale(0.1 -0.1)"
                fill="currentColor"
                d="M3372 6553 c-61 -580 -162 -954 -361 -1338 -132 -254 -239 -412 -377 -555 l-84 -87 0 -60 c0 -126 -46 -292 -113 -406 -141 -240 -432 -400 -845 -462 -54 -9 -47 -18 25 -34 140 -32 309 -118 402 -205 95 -90 136 -157 290 -472 114 -235 153 -288 359 -499 106 -108 146 -156 174 -210 38 -73 93 -238 104 -314 16 -100 21 5 20 384 -1 485 10 448 -166 551 -179 105 -249 243 -250 495 0 193 56 352 216 608 107 173 121 218 150 494 5 53 15 71 101 200 53 78 105 153 115 167 19 24 19 18 16 -420 l-4 -445 -36 -100 c-55 -150 -75 -200 -118 -288 -22 -44 -38 -82 -36 -84 1 -2 103 118 225 267 l221 270 -2 1381 -3 1380 -23 -218z M3590 5390 c-11 -71 3 -828 16 -851 16 -33 54 -63 144 -115 179 -105 249 -243 250 -495 0 -193 -56 -352 -216 -608 -92 -148 -119 -220 -134 -361 -6 -58 -14 -124 -16 -148 -5 -38 -122 -229 -216 -351 -19 -25 -19 -18 -16 415 3 429 4 441 27 509 37 111 90 244 132 329 21 44 37 81 35 83 -1 2 -103 -118 -225 -267 l-221 -269 1 -1383 1 -1383 24 214 c39 353 92 633 166 876 115 373 370 826 587 1040 l71 69 0 61 c0 168 68 361 175 497 145 185 427 319 783 373 54 9 47 18 -25 34 -140 32 -309 118 -402 205 -95 90 -136 157 -290 472 -114 235 -153 288 -359 499 -173 176 -229 281 -280 525 -6 25 -11 38 -12 30z"
              />
            </svg>
            <span className="text-2xl font-light text-muted-foreground">/</span>
            <span className="font-space text-5xl leading-none font-bold tracking-[-0.04em]">
              SIRIUS
            </span>
          </div>

          <div className="mt-8 space-y-6">
            <Button
              onClick={handleGoogleLogin}
              disabled={isOAuthPending}
              variant="outline"
              className="h-10 w-full text-sm disabled:opacity-60"
            >
              <GoogleSvg size={16} />
              {isOAuthPending ? t.redirecting : t.continueWithGoogle}
            </Button>

            <div className="flex items-center gap-3 text-[10px] uppercase text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <EmailLoginForm />
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t.noAccount}{" "}
            <Link
              href="/register"
              className="font-semibold text-foreground hover:underline"
            >
              {t.signUp}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginContent />
    </Suspense>
  );
}

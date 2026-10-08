"use client";

import { useActionState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { signInWithEmail, signInWithGoogle } from "@/app/_actions/auth";

interface LoginFormProps {
  next?: string;
  initialError?: string;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export function LoginForm({ next = "/", initialError }: LoginFormProps) {
  const [emailState, emailAction, emailPending] = useActionState(signInWithEmail, undefined);
  const [googleState, googleAction, googlePending] = useActionState(signInWithGoogle, undefined);
  const error = emailState?.error ?? googleState?.error ?? initialError;

  return (
    <div className="mt-8 space-y-6 font-mono">
      <form action={googleAction}>
        <input type="hidden" name="next" value={next} />
        <Button
          type="submit"
          variant="outline"
          className="h-10 w-full rounded-full text-xs"
          disabled={googlePending}
        >
          <GoogleIcon />
          {googlePending ? "Redirecting…" : "Sign in with Google"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-[10px] uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={emailAction} className="space-y-5">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            required
            className="h-10 rounded-full px-4 text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            className="h-10 rounded-full px-4 text-xs"
          />
        </div>
        <Button type="submit" className="h-10 w-full rounded-full text-xs" disabled={emailPending}>
          {emailPending ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

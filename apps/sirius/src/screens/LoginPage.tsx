import { StarsArt } from "@/app/login/_components/StarsArt";
import { LoginForm } from "@/app/login/_components/LoginForm";

interface LoginPageProps {
  next?: string;
  error?: string;
}

export default function LoginPage({ next, error }: LoginPageProps) {
  return (
    <main className="dark relative flex flex-1 overflow-hidden bg-background text-foreground">
      <StarsArt />
      <div className="relative z-10 mx-auto flex w-full max-w-[1460px] items-center justify-center px-4 py-12">
        <div className="w-full max-w-xs">
          <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
            <path fill="currentColor" d="M4 4h7l-3 7H1zM13 13h7l-3 7h-7z" />
          </svg>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight">Sign In</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">Continue to access your dashboard</p>
          <LoginForm next={next} initialError={error === "oauth_failed" ? "Google sign-in failed." : undefined} />
        </div>
      </div>
    </main>
  );
}

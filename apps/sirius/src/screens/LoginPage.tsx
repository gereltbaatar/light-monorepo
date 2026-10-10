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
          <div className="flex items-center justify-center gap-3">
            <span className="font-space text-5xl leading-none font-bold tracking-[-0.04em]">
              LIFE
            </span>
            <span className="text-2xl font-light text-muted-foreground">/</span>
            <span className="font-space text-5xl leading-none font-bold tracking-[-0.04em]">
              SIRIUS
            </span>
          </div>

          <LoginForm
            next={next}
            initialError={
              error === "oauth_failed"
                ? "Google-ээр нэвтэрч чадсангүй."
                : undefined
            }
          />
        </div>
      </div>
    </main>
  );
}

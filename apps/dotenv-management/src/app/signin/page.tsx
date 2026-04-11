"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Checkbox } from "@workspace/ui";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (signInError) {
      toast.error("Sign in failed", {
        description: signInError.message,
      });
      setIsLoading(false);
      return;
    }

    toast.success("Signed in successfully!");

    // Redirect to dashboard
    router.push("/");
    router.refresh();
  };

  return (
    <AuthLayout>
      <div className="mt-8">
        <SocialButtons />

        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-semibold text-zinc-200"
            >
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="h-14 bg-zinc-900 border-2 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-200 text-base px-4"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-semibold text-zinc-200"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="h-14 bg-zinc-900 border-2 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl pr-14 transition-all duration-200 text-base px-4"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-emerald-500 transition-colors p-2 rounded-xl hover:bg-zinc-800/50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) =>
                  setRememberMe(checked as boolean)
                }
                className="border-zinc-600 data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500"
              />
              <Label
                htmlFor="remember"
                className="text-sm text-zinc-400 cursor-pointer select-none hover:text-zinc-300 transition-colors"
              >
                Remember me
              </Label>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-white hover:text-gray-400 transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg mt-6"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="relative text-center pt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-zinc-500">
                Don&apos;t have an account?
              </span>
            </div>
          </div>

          <Link href="/signup">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-zinc-700 text-white hover:bg-zinc-900 hover:border-zinc-600 rounded-xl font-medium transition-all"
            >
              Create an account
            </Button>
          </Link>
        </form>
      </div>
    </AuthLayout>
  );
}

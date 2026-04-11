"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@workspace/ui";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
        },
      },
    });

    if (signUpError) {
      toast.error("Sign up failed", {
        description: signUpError.message,
      });
      setIsLoading(false);
      return;
    }

    toast.success("Account created successfully!", {
      description: "Redirecting to sign in...",
    });
    setIsLoading(false);

    // Redirect to sign in page after success
    setTimeout(() => {
      router.push("/signin");
    }, 2000);
  };

  return (
    <AuthLayout>
      <div className="mt-8">
        <SocialButtons />

        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-sm font-semibold text-zinc-200"
              >
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="h-14 bg-zinc-900 border-2 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-200 text-base px-4"
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-sm font-semibold text-zinc-200"
              >
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="h-14 bg-zinc-900 border-2 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-200 text-base px-4"
                required
              />
            </div>
          </div>

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
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="h-14 bg-zinc-900 border-2 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl pr-14 transition-all duration-200 text-base px-4"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-gray-400 transition-colors p-2 rounded-xl hover:bg-zinc-800/50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-2">
              <svg
                className="w-4 h-4 text-zinc-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Must be at least 8 characters
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg mt-6"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </Button>

          <div className="relative text-center pt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-zinc-500">
                Already have an account?
              </span>
            </div>
          </div>

          <Link href="/signin">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-zinc-700 text-white hover:bg-zinc-900 hover:border-zinc-600 rounded-xl font-medium transition-all"
            >
              Sign in instead
            </Button>
          </Link>
        </form>
      </div>
    </AuthLayout>
  );
}

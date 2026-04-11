"use client";

import { useState, useEffect } from "react";
import { Home, Settings, ShieldCheck, LogOut } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface LeftNavBarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
}

export function LeftNavBar({ activeNav, onNavChange }: LeftNavBarProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleHomeClick = () => {
    router.push("/");
    onNavChange("database");
  };

  const handleSecretsClick = () => {
    router.push("/dotenv");
    onNavChange("secrets");
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
  };

  return (
    <div className="fixed md:static left-0 top-0 bottom-0 w-16 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-4 z-50">
      {/* Logo and Navigation - Top Section */}
      <div className="flex flex-col gap-1">
        <div className="relative w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={40}
            height={40}
            loading="eager"
            className="object-contain"
          />
        </div>

        {/* Navigation Icons */}
        <button
          onClick={handleHomeClick}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${activeNav === "database"
            ? "bg-zinc-800 text-white"
            : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
            }`}
          title="Home"
        >
          <Home className="w-5 h-5" />
        </button>

        <button
          onClick={handleSecretsClick}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${activeNav === "secrets"
            ? "bg-zinc-800 text-white"
            : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
            }`}
          title="Secrets Management"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>
      </div>

      {/* Spacer to push bottom section down */}
      <div className="flex-1" />

      {/* Bottom Section - Settings & Profile */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleSecretsClick}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${activeNav === "secrets"
            ? "bg-zinc-800 text-white"
            : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
            }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Profile Avatar with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:bg-zinc-900"
              title={user?.email || "Profile"}
            >
              <Avatar className="w-8 h-8">
                {user?.user_metadata?.avatar_url && (
                  <AvatarImage src={user.user_metadata.avatar_url} alt={user.email} />
                )}
                <AvatarFallback className="bg-emerald-500 text-black font-semibold text-xs">
                  {user?.email?.charAt(0).toUpperCase() || "G"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-56 bg-zinc-900 border-zinc-800">
            <DropdownMenuLabel className="text-white">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                </p>
                <p className="text-xs leading-none text-zinc-400">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-zinc-300 focus:text-white focus:bg-zinc-800 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

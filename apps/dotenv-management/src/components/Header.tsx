import { Avatar, AvatarFallback } from "@workspace/ui";
import { Settings as SettingsIcon, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
  pageName?: string;
}

export function Header({ onMenuClick, pageName }: HeaderProps) {
  return (
    <header className="border-b border-zinc-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors text-white"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center">
            <div className="text-2xl font-bold text-emerald-500">⚡</div>
            <span className="text-xl font-semibold">light</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-zinc-400">
            <button className="hover:text-white transition-colors">
              {pageName}
            </button>
          </nav>
        </div>
        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <button className="hover:text-white transition-colors hidden sm:block">
            Docs
          </button>
        </nav>
      </div>
    </header>
  );
}

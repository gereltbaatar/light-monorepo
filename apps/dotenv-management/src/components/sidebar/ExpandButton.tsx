"use client";

import { ChevronRight } from "lucide-react";

interface ExpandButtonProps {
  onClick: () => void;
}

export function ExpandButton({ onClick }: ExpandButtonProps) {
  return (
    <button
      onClick={onClick}
      className="hidden md:flex fixed left-16 top-4 z-50 items-center justify-center w-10 h-10 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors shadow-lg"
      title="Expand sidebar"
    >
      <ChevronRight className="w-5 h-5" />
    </button>
  );
}

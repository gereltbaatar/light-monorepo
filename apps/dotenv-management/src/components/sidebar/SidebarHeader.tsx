"use client";

import { PanelRightOpen, Plus, X } from "lucide-react";

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCreateGroup: () => void;
  onClose: () => void;
  pageName?: string;
}

export function SidebarHeader({
  isCollapsed,
  onToggleCollapse,
  onCreateGroup,
  onClose,
  pageName = "Home",
}: SidebarHeaderProps) {
  return (
    <div className={`px-4 py-4 ${isCollapsed ? "hidden" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-white">{pageName}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelRightOpen className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

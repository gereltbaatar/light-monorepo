"use client";

import Folder from "@/components/ui/Folder";
import type { SecretGroup } from "@/types/secrets";

interface SecretGroupFolderCardProps {
  group: SecretGroup;
  onClick: () => void;
}

export function SecretGroupFolderCard({
  group,
  onClick,
}: SecretGroupFolderCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center justify-center cursor-pointer group hover:bg-zinc-900/60 rounded-xl transition-colors w-full p-4 h-[220px]"
    >
      {/* Folder Icon */}
      <div className="flex items-center justify-center flex-1">
        <Folder size={1.2} color="#52525b" />
      </div>

      {/* Text Content */}
      <div className="text-center w-full">
        <h3 className="text-sm font-medium text-white mb-0.5 truncate">
          {group.group_name}
        </h3>
        <p className="text-xs text-zinc-500">
          {new Date(group.created_at).toLocaleDateString('mn-MN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
}

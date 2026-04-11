"use client";

import { Folder } from "lucide-react";
import type { SecretGroup } from "@/types/secrets";

interface ProjectsListProps {
  groups: SecretGroup[];
  activeGroupId: string | null;
  searchQuery: string;
  onGroupSelect: (groupId: string) => void;
  onCreateGroup: () => void;
  onClose: () => void;
}

export function ProjectsList({
  groups,
  activeGroupId,
  searchQuery,
  onGroupSelect,
  onCreateGroup,
  onClose,
}: ProjectsListProps) {
  const filteredGroups = groups.filter((group) =>
    group.group_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredGroups.length === 0) {
    return (
      <div className="px-3 py-12 text-center">
        {searchQuery ? (
          <>
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm text-zinc-500 mb-1">No results found</p>
            <p className="text-xs text-zinc-600">Try a different search term</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">📁</div>
            <p className="text-sm text-zinc-500 mb-2">No projects yet</p>
            <button
              onClick={onCreateGroup}
              className="text-xs text-white hover:text-gray-400 underline decoration-dotted underline-offset-4 transition-colors"
            >
              Create your first project
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1 mt-2 px-4">
      {filteredGroups.map((group) => (
        <button
          key={group.id}
          onClick={() => {
            onGroupSelect(group.id);
            onClose();
          }}
          className={`
            w-full flex items-center gap-2 py-2 rounded-lg
            text-sm transition-all text-left group
            ${activeGroupId === group.id
              ? "bg-zinc-800/10 text-white border border-zinc-800 shadow-sm"
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            }
          `}
          style={{ paddingLeft: "16px" }}
        >
          <Folder className="w-4 h-4" />
          <span className="truncate flex-1">{group.group_name}</span>
        </button>
      ))}
    </div>
  );
}

"use client";

import { Skeleton } from "@workspace/ui";
import type { SecretGroup } from "@/types/secrets";
import { ProjectsList } from "./ProjectsList";

interface DotEnvPageContentProps {
  groups: SecretGroup[];
  activeGroupId: string | null;
  searchQuery: string;
  onGroupSelect: (groupId: string) => void;
  onCreateGroup: () => void;
  onClose: () => void;
  isCollapsed: boolean;
  isLoading?: boolean;
}

export function DotEnvPageContent({
  groups,
  activeGroupId,
  searchQuery,
  onGroupSelect,
  onCreateGroup,
  onClose,
  isCollapsed,
  isLoading = false,
}: DotEnvPageContentProps) {
  return (
    /* Projects only view (no tabs) */
    <div className={`flex-1 overflow-y-auto py-2 ${isCollapsed ? "hidden" : ""}`}>
      {isLoading ? (
        <div className="px-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <ProjectsList
          groups={groups}
          activeGroupId={activeGroupId}
          searchQuery={searchQuery}
          onGroupSelect={onGroupSelect}
          onCreateGroup={onCreateGroup}
          onClose={onClose}
        />
      )}
    </div>
  );
}

"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent, Skeleton } from "@workspace/ui";
import type { SecretGroup } from "@/types/secrets";
import { FolderTree } from "./FolderTree";
import { ProjectsList } from "./ProjectsList";

interface FolderNode {
  id: string;
  name: string;
  count: number;
  children?: FolderNode[];
}

interface HomePageContentProps {
  groups: SecretGroup[];
  activeGroupId: string | null;
  searchQuery: string;
  onGroupSelect: (groupId: string) => void;
  onCreateGroup: () => void;
  onClose: () => void;
  isCollapsed: boolean;
  folderStructure: FolderNode[];
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  isLoading?: boolean;
}

export function HomePageContent({
  groups,
  activeGroupId,
  searchQuery,
  onGroupSelect,
  onCreateGroup,
  onClose,
  isCollapsed,
  folderStructure,
  expandedFolders,
  onToggleFolder,
  isLoading = false,
}: HomePageContentProps) {
  return (
    <Tabs
      defaultValue="folders"
      className={`flex-1 flex flex-col ${isCollapsed ? "hidden" : ""}`}
    >
      <div className="px-4 py-4">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-900 h-10 p-1 rounded-2xl">
          <TabsTrigger
            value="folders"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 rounded-xl transition-all px-4 py-1.5 text-sm font-medium"
          >
            Folders
          </TabsTrigger>
          <TabsTrigger
            value="tags"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 rounded-xl transition-all px-4 py-1.5 text-sm font-medium"
          >
            Tags
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="folders"
        className="flex-1 overflow-y-auto py-2 mt-0"
      >
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
          <>
            <FolderTree
              folders={folderStructure}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
            <ProjectsList
              groups={groups}
              activeGroupId={activeGroupId}
              searchQuery={searchQuery}
              onGroupSelect={onGroupSelect}
              onCreateGroup={onCreateGroup}
              onClose={onClose}
            />
          </>
        )}
      </TabsContent>

      <TabsContent value="tags" className="flex-1 overflow-y-auto mt-0">
        <div className="px-4 py-12 text-center">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="text-sm text-zinc-500 mb-1">No tags yet</p>
          <p className="text-xs text-zinc-600">
            Tags will help organize your secrets
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}

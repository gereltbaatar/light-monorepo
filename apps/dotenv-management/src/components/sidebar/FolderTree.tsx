"use client";

import { useState } from "react";
import { Folder, ChevronRight, ChevronDown } from "lucide-react";

interface FolderNode {
  id: string;
  name: string;
  count: number;
  children?: FolderNode[];
}

interface FolderTreeProps {
  folders: FolderNode[];
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
}

export function FolderTree({
  folders,
  expandedFolders,
  onToggleFolder,
}: FolderTreeProps) {
  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const paddingLeft = level * 16;

    return (
      <div key={folder.id}>
        <button
          onClick={() => hasChildren && onToggleFolder(folder.id)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors group"
          style={{ paddingLeft: `${12 + paddingLeft}px` }}
        >
          {hasChildren && (
            <>
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              )}
            </>
          )}
          {!hasChildren && <div className="w-3.5" />}
          <Folder className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="flex-1 text-left truncate">{folder.name}</span>
          {folder.count > 0 && (
            <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
              {folder.count}
            </span>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="relative">
            <div
              className="absolute top-0 bottom-0 border-l border-zinc-800"
              style={{ left: `${20 + paddingLeft}px` }}
            />
            {folder.children!.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-0.5">
      {folders.map((folder) => renderFolder(folder))}
    </div>
  );
}

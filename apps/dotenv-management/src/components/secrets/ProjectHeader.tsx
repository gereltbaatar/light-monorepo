"use client";

import { Button } from "@workspace/ui";
import { Download, Plus, Folder, Upload } from "lucide-react";
import type { SecretGroup } from "@/types/secrets";

interface ProjectHeaderProps {
  group: SecretGroup;
  onImportClick: () => void;
  onExportClick: () => void;
  onAddSecretClick: () => void;
}

export function ProjectHeader({
  group,
  onImportClick,
  onExportClick,
  onAddSecretClick,
}: ProjectHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
          <Folder className="w-7 h-7 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 truncate">
            {group.group_name}
          </h1>
          {group.description && (
            <p className="text-zinc-400 text-sm md:text-base">
              {group.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onImportClick}
          variant="outline"
          className="border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import .env
        </Button>
        <Button
          onClick={onExportClick}
          variant="outline"
          className="border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600"
        >
          <Download className="w-4 h-4 mr-2" />
          Export .env
        </Button>
        <Button
          onClick={onAddSecretClick}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Secret
        </Button>
      </div>
    </div>
  );
}

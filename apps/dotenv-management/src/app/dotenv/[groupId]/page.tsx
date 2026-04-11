"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ProjectsSidebar } from "@/components/ProjectsSidebar";
import { ProjectHeader } from "@/components/secrets/ProjectHeader";
import { EnvironmentTabs } from "@/components/secrets/EnvironmentTabs";
import { FileImportInput } from "@/components/secrets/FileImportInput";
import { AddSecretDialog } from "@/components/secrets/AddSecretDialog";
import { CreateGroupDialog } from "@/components/secrets/CreateGroupDialog";
import type { SecretGroup, Secret, Environment } from "@/types/secrets";
import { toast } from "sonner";

export default function SecretGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [groups, setGroups] = useState<SecretGroup[]>([]);
  const [group, setGroup] = useState<SecretGroup | null>(null);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEnv, setActiveEnv] = useState<Environment>("dev");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchGroup();
    fetchSecrets();
  }, [groupId]);

  useEffect(() => {
    fetchSecrets();
  }, [activeEnv]);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      const data = await response.json();
      setGroup(data.group);
    } catch (error) {
      console.error("Failed to fetch group:", error);
    }
  };

  const fetchSecrets = async () => {
    try {
      const response = await fetch(
        `/api/secrets?groupId=${groupId}&env=${activeEnv}`
      );
      const data = await response.json();
      setSecrets(data.secrets || []);
    } catch (error) {
      console.error("Failed to fetch secrets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupIds: [groupId],
          environment: activeEnv,
        }),
      });

      const data = await response.text();

      // Create and download .env file
      const blob = new Blob([data], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `.env.${activeEnv}`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Environment file exported successfully");
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Failed to export environment file");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split("\n");
      let importedCount = 0;
      let skippedCount = 0;

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith("#")) continue;

        // Parse KEY=VALUE format
        const equalIndex = trimmed.indexOf("=");
        if (equalIndex === -1) continue;

        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();

        if (!key || !value) continue;

        try {
          const response = await fetch("/api/secrets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId,
              environment: activeEnv,
              key,
              value,
            }),
          });

          if (response.ok) {
            importedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error(`Failed to import ${key}:`, error);
          skippedCount++;
        }
      }

      // Reset file input
      event.target.value = "";

      // Refresh secrets list
      fetchSecrets();

      // Show toast notification
      if (importedCount > 0) {
        toast.success(`Successfully imported ${importedCount} secret${importedCount > 1 ? "s" : ""}${skippedCount > 0 ? ` (${skippedCount} skipped)` : ""}`);
      } else if (skippedCount > 0) {
        toast.error(`Failed to import secrets. ${skippedCount} skipped.`);
      } else {
        toast.info("No valid secrets found in file");
      }
    } catch (error) {
      console.error("Failed to read file:", error);
      toast.error("Failed to read environment file");
    }
  };

  const handleSecretAdded = () => {
    setShowAddDialog(false);
    fetchSecrets();
  };

  const handleSecretDeleted = () => {
    fetchSecrets();
  };

  const handleGroupCreated = () => {
    setShowCreateDialog(false);
    fetchGroups();
  };

  const handleGroupSelect = (selectedGroupId: string) => {
    router.push(`/dotenv/${selectedGroupId}`);
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <ProjectsSidebar
          groups={groups}
          activeGroupId={groupId}
          onGroupSelect={handleGroupSelect}
          onCreateGroup={() => setShowCreateDialog(true)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <ProjectsSidebar
        groups={groups}
        activeGroupId={groupId}
        onGroupSelect={handleGroupSelect}
        onCreateGroup={() => setShowCreateDialog(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <ProjectHeader
              group={group}
              onImportClick={handleImportClick}
              onExportClick={handleExport}
              onAddSecretClick={() => setShowAddDialog(true)}
            />

            <FileImportInput
              ref={fileInputRef}
              onFileImport={handleFileImport}
            />

            <EnvironmentTabs
              activeEnv={activeEnv}
              onEnvChange={setActiveEnv}
              secrets={secrets}
              isLoading={isLoading}
              onSecretDeleted={handleSecretDeleted}
            />
          </div>
        </main>
      </div>

      <AddSecretDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        groupId={groupId}
        environment={activeEnv}
        onSuccess={handleSecretAdded}
      />

      <CreateGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleGroupCreated}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@workspace/ui";
import { Plus } from "lucide-react";
import { SecretGroupCard } from "@/components/secrets/SecretGroupCard";
import { CreateGroupDialog } from "@/components/secrets/CreateGroupDialog";
import type { SecretGroup } from "@/types/secrets";

export default function Home() {
  const [groups, setGroups] = useState<SecretGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupCreated = () => {
    setShowCreateDialog(false);
    fetchGroups();
  };

  const handleGroupDeleted = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId));
  };

  return (
    <main className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Secrets Management</h1>
            <p className="text-zinc-400">
              Manage environment variables for your projects
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-white hover:bg-gray-100 text-black font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Project
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-zinc-900 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-zinc-400 mb-6">
              Create your first project to manage secrets
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-white hover:bg-gray-100 text-black font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <SecretGroupCard
                key={group.id}
                group={group}
                onDeleted={handleGroupDeleted}
              />
            ))}
          </div>
        )}
      </div>

      <CreateGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleGroupCreated}
      />
    </main>
  );
}

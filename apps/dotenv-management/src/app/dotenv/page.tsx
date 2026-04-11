"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SecretGroupFolderCard } from "@/components/secrets/SecretGroupFolderCard";
import { CreateGroupDialog } from "@/components/secrets/CreateGroupDialog";
import type { SecretGroup } from "@/types/secrets";
import { Plus } from "lucide-react";

export default function DotenvPage() {
  const router = useRouter();
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

  const handleGroupSelect = (groupId: string) => {
    router.push(`/dotenv/${groupId}`);
  };

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 text-black font-semibold rounded-xl transition-colors"
          >
            <p className="text-sm font-semibold">Add Project</p>
            <Plus className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔐</div>
            <p className="text-zinc-400 text-lg mb-6">No secret groups yet</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 rounded-lg py-6">
            {groups.map((group) => (
              <SecretGroupFolderCard
                key={group.id}
                group={group}
                onClick={() => handleGroupSelect(group.id)}
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

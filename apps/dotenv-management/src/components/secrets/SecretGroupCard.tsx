import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, Button } from "@workspace/ui";
import { Folder, Trash2, Eye } from "lucide-react";
import type { SecretGroup } from "@/types/secrets";

interface SecretGroupCardProps {
  group: SecretGroup;
  onClick?: () => void;
  onDeleted?: (groupId: string) => void;
}

export function SecretGroupCard({ group, onClick, onDeleted }: SecretGroupCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${group.group_name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDeleted?.(group.id);
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/dotenv/${group.id}`);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Folder className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{group.group_name}</h3>
              <p className="text-sm text-zinc-500">
                {new Date(group.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {group.description && (
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
            {group.description}
          </p>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleView}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Secrets
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="outline"
            className="border-red-900/50 text-red-500 hover:bg-red-950/30"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Button, Card, CardContent } from "@workspace/ui";
import { Eye, EyeOff, Trash2, Copy, Check } from "lucide-react";
import type { Secret } from "@/types/secrets";

interface SecretsListProps {
  secrets: Secret[];
  isLoading: boolean;
  onSecretDeleted: () => void;
}

export function SecretsList({
  secrets,
  isLoading,
  onSecretDeleted,
}: SecretsListProps) {
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [copiedSecrets, setCopiedSecrets] = useState<Set<string>>(new Set());

  const toggleVisibility = (secretId: string) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(secretId)) {
      newVisible.delete(secretId);
    } else {
      newVisible.add(secretId);
    }
    setVisibleSecrets(newVisible);
  };

  const handleCopy = async (secret: Secret) => {
    await navigator.clipboard.writeText(secret.value);
    const newCopied = new Set(copiedSecrets);
    newCopied.add(secret.id);
    setCopiedSecrets(newCopied);

    setTimeout(() => {
      const updated = new Set(copiedSecrets);
      updated.delete(secret.id);
      setCopiedSecrets(updated);
    }, 2000);
  };

  const handleDelete = async (secretId: string) => {
    if (!confirm("Are you sure you want to delete this secret?")) {
      return;
    }

    try {
      const response = await fetch(`/api/secrets/${secretId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onSecretDeleted();
      }
    } catch (error) {
      console.error("Failed to delete secret:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-zinc-900 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (secrets.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-12 text-center">
          <div className="text-4xl mb-3">🔑</div>
          <h3 className="text-lg font-semibold mb-2">No secrets yet</h3>
          <p className="text-zinc-400 text-sm">
            Add your first secret to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {secrets.map((secret) => (
        <Card key={secret.id} className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-semibold text-emerald-400 mb-1">
                  {secret.key}
                </div>
                <div className="font-mono text-sm text-zinc-400 flex items-center gap-2">
                  {visibleSecrets.has(secret.id) ? (
                    <span>{secret.value}</span>
                  ) : (
                    <span>{"•".repeat(Math.min(secret.value.length, 20))}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => toggleVisibility(secret.id)}
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  {visibleSecrets.has(secret.id) ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  onClick={() => handleCopy(secret)}
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  {copiedSecrets.has(secret.id) ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  onClick={() => handleDelete(secret.id)}
                  variant="outline"
                  size="sm"
                  className="border-red-900/50 text-red-500 hover:bg-red-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

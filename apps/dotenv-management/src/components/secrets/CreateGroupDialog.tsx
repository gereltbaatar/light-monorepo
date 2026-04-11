"use client";

import { useState } from "react";
import { X, Folder } from "lucide-react";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateGroupDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    groupName: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create group");
      }

      setFormData({ groupName: "", description: "" });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative bg-zinc-900 rounded-3xl w-full max-w-md overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-linear-to-br from-emerald-500/10 via-zinc-900 to-zinc-900 border-b border-zinc-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Create Project</h2>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Set up a new secrets group
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-6 bg-red-950/30 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
            <div className="w-1 h-full bg-red-500 rounded-full shrink-0 mt-1" />
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Group Name */}
          <div className="space-y-2">
            <label
              htmlFor="groupName"
              className="block text-sm font-medium text-zinc-300"
            >
              Project Name
              <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              id="groupName"
              type="text"
              placeholder="my-awesome-project"
              value={formData.groupName}
              onChange={(e) =>
                setFormData({ ...formData, groupName: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-700 rounded-2xl text-black placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-gray-300 transition-all"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-300"
            >
              Description
              <span className="text-zinc-500 ml-1 text-xs">(optional)</span>
            </label>
            <textarea
              id="description"
              placeholder="Production environment secrets for my app"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-700 rounded-2xl text-black placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-gray-300 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.groupName.trim()}
              className="flex-1 px-4 py-2 bg-white hover:bg-white/80 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

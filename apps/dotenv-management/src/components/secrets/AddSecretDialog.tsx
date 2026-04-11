"use client";

import { useState } from "react";
import { X, Key, Eye, EyeOff } from "lucide-react";
import type { Environment } from "@/types/secrets";

interface AddSecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  environment: Environment;
  onSuccess: () => void;
}

const ENV_BADGES = {
  dev: { label: "Development", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  test: { label: "Testing", color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" },
  prod: { label: "Production", color: "bg-red-500/10 border-red-500/20 text-red-400" },
};

export function AddSecretDialog({
  open,
  onOpenChange,
  groupId,
  environment,
  onSuccess,
}: AddSecretDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValue, setShowValue] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    value: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          environment,
          key: formData.key,
          value: formData.value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add secret");
      }

      setFormData({ key: "", value: "" });
      setShowValue(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add secret");
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  const envBadge = ENV_BADGES[environment];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-linear-to-br from-emerald-500/10 via-zinc-900 to-zinc-900 border-b border-zinc-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Key className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Secret</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${envBadge.color}`}>
                    {envBadge.label}
                  </span>
                </div>
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
          {/* Key */}
          <div className="space-y-2">
            <label
              htmlFor="key"
              className="block text-sm font-medium text-zinc-300"
            >
              Environment Variable Key
              <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              id="key"
              type="text"
              placeholder="API_KEY"
              value={formData.key}
              onChange={(e) =>
                setFormData({ ...formData, key: e.target.value.toUpperCase() })
              }
              className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-lg text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono uppercase"
              required
              autoFocus
            />
            <p className="text-xs text-zinc-500">
              Use UPPER_SNAKE_CASE format (e.g., DATABASE_URL)
            </p>
          </div>

          {/* Value */}
          <div className="space-y-2">
            <label
              htmlFor="value"
              className="block text-sm font-medium text-zinc-300"
            >
              Secret Value
              <span className="text-red-400 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                id="value"
                type={showValue ? "text" : "password"}
                placeholder="your-secret-value"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                className="w-full px-4 py-3 pr-12 bg-white border border-zinc-300 rounded-lg text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                {showValue ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              This value will be encrypted and stored securely
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.key.trim() || !formData.value.trim()}
              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-semibold rounded-lg transition-all disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
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
                  Adding...
                </span>
              ) : (
                "Add Secret"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

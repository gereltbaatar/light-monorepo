"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent, Badge } from "@workspace/ui";
import { Lock } from "lucide-react";
import { SecretsList } from "./SecretsList";
import type { Environment, Secret } from "@/types/secrets";

interface EnvironmentTabsProps {
  activeEnv: Environment;
  onEnvChange: (env: Environment) => void;
  secrets: Secret[];
  isLoading: boolean;
  onSecretDeleted: () => void;
}

export function EnvironmentTabs({
  activeEnv,
  onEnvChange,
  secrets,
  isLoading,
  onSecretDeleted,
}: EnvironmentTabsProps) {
  return (
    <Tabs
      value={activeEnv}
      onValueChange={(v) => onEnvChange(v as Environment)}
      className="w-full"
    >
      <TabsList className="grid max-w-md grid-cols-3 mb-6  bg-zinc-900 h-10 p-1 rounded-2xl">
        <TabsTrigger
          value="dev"
          className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 rounded-xl transition-all px-4 py-1.5 text-sm font-medium"
        >
          <span className="hidden sm:inline">Development</span>
          <span className="sm:hidden">Dev</span>
        </TabsTrigger>
        <TabsTrigger
          value="test"
          className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 rounded-xl transition-all px-4 py-1.5 text-sm font-medium"
        >
          <span className="hidden sm:inline">Testing</span>
          <span className="sm:hidden">Test</span>
        </TabsTrigger>
        <TabsTrigger
          value="prod"
          className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 rounded-xl transition-all px-4 py-1.5 text-sm font-medium"
        >
          <span className="hidden sm:inline">Production</span>
          <span className="sm:hidden">Prod</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeEnv} className="mt-0">
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-zinc-500" />
              <h2 className="text-lg font-semibold">Environment Variables</h2>
            </div>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400">
              {secrets.length} {secrets.length === 1 ? "secret" : "secrets"}
            </Badge>
          </div>
          <SecretsList
            secrets={secrets}
            isLoading={isLoading}
            onSecretDeleted={onSecretDeleted}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

#!/usr/bin/env node

/**
 * Fetch .env file from dotenv-management API
 * Usage: pnpm fetch-env --groups=<group1,group2> --env=<dev|test|prod>
 */

import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // Load env files in order of priority
  // 1. Project-level .env.local (highest priority)
  // 2. Root-level .env.shared (shared across monorepo)
  // 3. Project-level .env

  const projectEnvLocal = path.join(process.cwd(), ".env.local");
  const rootSharedEnv = path.join(process.cwd(), "../../.env.shared");
  const projectEnv = path.join(process.cwd(), ".env");

  // Load root shared env first
  if (fs.existsSync(rootSharedEnv)) {
    config({ path: rootSharedEnv });
  }

  // Then load project-level .env.local (overrides shared)
  if (fs.existsSync(projectEnvLocal)) {
    config({ path: projectEnvLocal, override: true });
  }

  // Parse command line arguments
  const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.split("=");
    acc[key.replace("--", "")] = value;
    return acc;
  }, {} as Record<string, string>);

  // Try to load .dotenv-config.json from project root
  let configGroups: string[] | undefined;
  let configEnv: string | undefined;

  const configPath = path.join(process.cwd(), ".dotenv-config.json");
  if (fs.existsSync(configPath)) {
    try {
      const configFile = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      configGroups = configFile.groups;
      configEnv = configFile.environment;
    } catch (error) {
      console.warn("⚠️  Failed to parse .dotenv-config.json");
    }
  }

  // Support multiple groups separated by comma
  // Priority: CLI args > .dotenv-config.json > env vars > default
  const groupsInput = args.groups || args.group || (configGroups ? configGroups.join(",") : process.env.SECRET_GROUP) || "default";
  const environment = (args.env || configEnv || process.env.NODE_ENV || "dev") as "dev" | "test" | "prod";

  // Split groups by comma
  const groupNames = groupsInput.split(",").map((g: string) => g.trim());

  // API URL from environment
  const apiUrl = process.env.DOTENV_API_URL;

  if (!apiUrl) {
    console.error("❌ Error: DOTENV_API_URL not set");
    console.log("Please add DOTENV_API_URL to your .env.local file");
    console.log("Example: DOTENV_API_URL=https://your-dotenv-app.vercel.app");
    process.exit(1);
  }

  console.log(`📦 Fetching secrets from ${apiUrl} for groups: ${groupNames.join(", ")} (${environment})`);

  try {
    // Fetch secrets from API
    const response = await fetch(`${apiUrl}/api/secrets/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        groups: groupNames,
        environment,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      console.error(`❌ API Error: ${error.error || response.statusText}`);
      process.exit(1);
    }

    const data = await response.json();
    const { secrets, groups, count } = data;

    if (!secrets || Object.keys(secrets).length === 0) {
      console.warn(`⚠️  No secrets found`);
      console.log(`\n💡 Tip: Add secrets at ${apiUrl}/dotenv`);

      // Create empty .env file
      const envPath = path.join(process.cwd(), ".env");
      fs.writeFileSync(envPath, "# No secrets found\n", "utf-8");
      return;
    }

    // Build .env file content
    let envContent = `# Generated from: ${apiUrl}\n`;
    envContent += `# Groups: ${groups.join(", ")}\n`;
    envContent += `# Environment: ${environment}\n`;
    envContent += `# Generated at: ${new Date().toISOString()}\n\n`;

    for (const key in secrets) {
      if (Object.hasOwnProperty.call(secrets, key)) {
        envContent += `${key}=${secrets[key]}\n`;
      }
    }

    // Write to .env file
    const envPath = path.join(process.cwd(), ".env");
    fs.writeFileSync(envPath, envContent, "utf-8");

    console.log(`✅ Successfully wrote ${count} secrets from ${groups.length} group(s) to .env`);
    console.log(`📄 File: ${envPath}`);
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();

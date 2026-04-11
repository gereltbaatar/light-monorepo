#!/usr/bin/env node

/**
 * Fetch .env file from dotenv-management API
 * Usage: node scripts/fetch-env-from-api.ts --groups=<group1,group2> --env=<dev|test|prod>
 */

import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// Check if .env.local exists, if not create it with prompts
const envLocalPath = path.join(process.cwd(), ".env.local");

async function setupEnvLocal() {
  if (fs.existsSync(envLocalPath)) {
    return; // .env.local already exists
  }

  console.log("📝 First time setup: .env.local not found");
  console.log("Let's configure your dotenv-management API\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  };

  try {
    const apiUrl = await question("Enter DOTENV_API_URL (e.g., https://your-app.vercel.app): ");

    const envContent = `# Dotenv Management API Configuration
DOTENV_API_URL=${apiUrl.trim()}

# Secret Group Configuration
SECRET_GROUP=default
NODE_ENV=development
`;

    fs.writeFileSync(envLocalPath, envContent, "utf-8");
    console.log("\n✅ Created .env.local successfully!\n");
  } finally {
    rl.close();
  }
}

async function main() {
  // Run setup if needed, then load env vars
  await setupEnvLocal();
  config({ path: envLocalPath });

  // Parse command line arguments
  const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.split("=");
    acc[key.replace("--", "")] = value;
    return acc;
  }, {} as Record<string, string>);

  // Support multiple groups separated by comma
  const groupsInput = args.groups || args.group || process.env.SECRET_GROUP || process.env.DEFAULT_SECRET_GROUP;
  const environment = (args.env || process.env.NODE_ENV || "dev") as "dev" | "test" | "prod";

  if (!groupsInput) {
    console.error("❌ Error: --groups or --group parameter is required");
    console.log("\nUsage: node scripts/fetch-env-from-api.ts --groups=<group1,group2> --env=<dev|test|prod>");
    process.exit(1);
  }

  // Split groups by comma
  const groupNames = groupsInput.split(",").map((g: string) => g.trim());

  // API URL from environment
  const apiUrl = process.env.DOTENV_API_URL;

  if (!apiUrl) {
    console.error("❌ Error: Missing DOTENV_API_URL");
    console.log("Please set DOTENV_API_URL in .env.local");
    process.exit(1);
  }

  async function fetchAndWriteEnv() {
    console.log(`📦 Fetching secrets from API for groups: ${groupNames.join(", ")} (${environment})`);

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
        const error = await response.json();
        console.error(`❌ API Error: ${error.error || response.statusText}`);
        process.exit(1);
      }

      const data = await response.json();
      const { secrets, groups, count } = data;

      if (!secrets || Object.keys(secrets).length === 0) {
        console.warn(`⚠️  No secrets found for groups: ${groupNames.join(", ")}`);
        console.log(`\n💡 Tip: Add secrets via the web UI at ${apiUrl}/dotenv`);

        // Create empty .env file
        const envPath = path.join(process.cwd(), ".env");
        fs.writeFileSync(envPath, "# No secrets found\n", "utf-8");
        return;
      }

      // Build .env file content
      let envContent = `# Generated from API: ${apiUrl}\n`;
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

  await fetchAndWriteEnv();
}

main();

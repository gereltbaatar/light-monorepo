#!/usr/bin/env node

/**
 * Fetch .env file from Supabase
 * Usage: node scripts/fetch-env.ts --group=<group-name> --env=<dev|test|prod>
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
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
  console.log("Let's configure your Supabase credentials\n");

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
    const supabaseUrl = await question("Enter NEXT_PUBLIC_SUPABASE_URL: ");
    const anonKey = await question("Enter NEXT_PUBLIC_SUPABASE_ANON_KEY: ");
    const serviceRoleKey = await question("Enter SUPABASE_SERVICE_ROLE_KEY: ");

    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl.trim()}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey.trim()}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey.trim()}

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

  // Support multiple groups separated by comma (like Pinecone)
  const groupsInput = args.groups || args.group || process.env.SECRET_GROUP || process.env.DEFAULT_SECRET_GROUP;
  const environment = (args.env || process.env.NODE_ENV || "dev") as "dev" | "test" | "prod";

  if (!groupsInput) {
    console.error("❌ Error: --groups or --group parameter is required");
    console.log("\nUsage: node scripts/fetch-env.ts --groups=<group1,group2> --env=<dev|test|prod>");
    console.log("   or: node scripts/fetch-env.ts --group=<group-name> --env=<dev|test|prod>");
    process.exit(1);
  }

  // Split groups by comma to support multiple groups
  const groupNames = groupsInput.split(",").map((g: string) => g.trim());

  // Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: Missing Supabase credentials");
    console.log("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  async function fetchAndWriteEnv() {
    console.log(`📦 Fetching secrets for groups: ${groupNames.join(", ")} (${environment})`);

    try {
      // Fetch all secret groups from Supabase (supports multiple groups like Pinecone)
      const { data: groups, error: groupError } = await supabase
        .from("secret_groups")
        .select("*")
        .in("group_name", groupNames);

      if (groupError) {
        console.error(`❌ Error fetching groups: ${groupError.message}`);
        process.exit(1);
      }

      // Check which groups are missing
      const foundGroupNames = groups?.map((g: any) => g.group_name) || [];
      const missingGroups = groupNames.filter((name) => !foundGroupNames.includes(name));

      // Auto-create missing groups
      if (missingGroups.length > 0) {
        console.log(`📝 Creating missing groups: ${missingGroups.join(", ")}`);

        // Get first user ID
        const { data: existingGroups } = await supabase
          .from("secret_groups")
          .select("user_id")
          .limit(1);

        let userId;

        if (existingGroups && existingGroups.length > 0) {
          userId = existingGroups[0].user_id;
        } else {
          const { data: authUsers } = await supabase.auth.admin.listUsers();

          if (!authUsers || authUsers.users.length === 0) {
            console.error(`❌ Error: No users found. Please sign up first.`);
            console.log(`\n💡 Tip: Run "pnpm dev:next" to start without env fetching, then sign up.`);
            process.exit(1);
          }

          userId = authUsers.users[0].id;
        }

        // Create all missing groups
        const newGroups = missingGroups.map((name) => ({
          user_id: userId,
          group_name: name,
          description: `Auto-created group for ${environment} environment`,
        }));

        const { data: createdGroups, error: createError } = await supabase
          .from("secret_groups")
          .insert(newGroups)
          .select();

        if (createError) {
          console.error(`❌ Error creating groups: ${createError.message}`);
          process.exit(1);
        }

        console.log(`✅ Created ${createdGroups?.length || 0} groups`);
        groups?.push(...(createdGroups || []));
      }

      if (!groups || groups.length === 0) {
        console.warn(`⚠️  No groups found`);
        return;
      }

      // Fetch secrets for all groups (like Pinecone's reduce pattern)
      const groupIds = groups.map((g: any) => g.id);
      const { data: allSecrets, error: secretsError } = await supabase
        .from("secrets")
        .select("*")
        .in("group_id", groupIds)
        .eq("environment", environment);

      if (secretsError) {
        console.error(`❌ Error fetching secrets: ${secretsError.message}`);
        process.exit(1);
      }

      if (!allSecrets || allSecrets.length === 0) {
        console.warn(`⚠️  No secrets found for any groups in ${environment} environment`);
        console.log(`\n💡 Tip: Add secrets via the web UI at /dotenv`);

        // Create empty .env file
        const envPath = path.join(process.cwd(), ".env");
        fs.writeFileSync(envPath, "# No secrets found\n", "utf-8");
        return;
      }

      // Merge all secrets (like Pinecone's reduce pattern)
      // If multiple groups have the same key, later groups override earlier ones
      const mergedSecrets: Record<string, string> = {};

      for (const secret of allSecrets) {
        mergedSecrets[secret.key] = secret.value;
      }

      // Build .env file content
      let envContent = `# Generated from groups: ${groupNames.join(", ")}\n`;
      envContent += `# Environment: ${environment}\n`;
      envContent += `# Generated at: ${new Date().toISOString()}\n\n`;

      for (const key in mergedSecrets) {
        if (Object.hasOwnProperty.call(mergedSecrets, key)) {
          envContent += `${key}=${mergedSecrets[key]}\n`;
        }
      }

      // Write to .env file
      const envPath = path.join(process.cwd(), ".env");
      fs.writeFileSync(envPath, envContent, "utf-8");

      const secretCount = Object.keys(mergedSecrets).length;
      console.log(`✅ Successfully wrote ${secretCount} secrets from ${groups.length} group(s) to .env`);
      console.log(`📄 File: ${envPath}`);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  await fetchAndWriteEnv();
}

main();

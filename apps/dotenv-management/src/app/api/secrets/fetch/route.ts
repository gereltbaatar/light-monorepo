import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groups, environment = "dev" } = body;

    // Validate input
    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json(
        { error: "Groups array is required" },
        { status: 400 }
      );
    }

    if (!["dev", "test", "prod"].includes(environment)) {
      return NextResponse.json(
        { error: "Environment must be dev, test, or prod" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user (optional - can be used for RLS)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch secret groups
    const { data: secretGroups, error: groupError } = await supabase
      .from("secret_groups")
      .select("*")
      .in("group_name", groups);

    if (groupError) {
      return NextResponse.json(
        { error: groupError.message },
        { status: 500 }
      );
    }

    if (!secretGroups || secretGroups.length === 0) {
      return NextResponse.json(
        { error: "No groups found" },
        { status: 404 }
      );
    }

    // Fetch secrets for all groups
    const groupIds = secretGroups.map((g) => g.id);
    const { data: allSecrets, error: secretsError } = await supabase
      .from("secrets")
      .select("*")
      .in("group_id", groupIds)
      .eq("environment", environment);

    if (secretsError) {
      return NextResponse.json(
        { error: secretsError.message },
        { status: 500 }
      );
    }

    // Merge all secrets (like Pinecone pattern)
    const mergedSecrets: Record<string, string> = {};

    if (allSecrets) {
      for (const secret of allSecrets) {
        mergedSecrets[secret.key] = secret.value;
      }
    }

    return NextResponse.json({
      secrets: mergedSecrets,
      groups: secretGroups.map((g) => g.group_name),
      environment,
      count: Object.keys(mergedSecrets).length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

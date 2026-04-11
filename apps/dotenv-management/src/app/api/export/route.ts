import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { groupIds, environment } = body;

  if (!groupIds || !Array.isArray(groupIds) || !environment) {
    return NextResponse.json(
      { error: "groupIds and environment are required" },
      { status: 400 }
    );
  }

  // Verify user owns all groups
  const { data: groups } = await supabase
    .from("secret_groups")
    .select("id")
    .in("id", groupIds)
    .eq("user_id", user.id);

  if (!groups || groups.length !== groupIds.length) {
    return NextResponse.json(
      { error: "One or more groups not found" },
      { status: 404 }
    );
  }

  // Fetch all secrets for the groups and environment
  const { data: secrets, error } = await supabase
    .from("secrets")
    .select("key, value")
    .in("group_id", groupIds)
    .eq("environment", environment)
    .order("key", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format as .env file
  const envContent = secrets
    .map((secret) => `${secret.key}=${secret.value}`)
    .join("\n");

  return new NextResponse(envContent, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const env = searchParams.get("env");

  if (!groupId || !env) {
    return NextResponse.json(
      { error: "groupId and env are required" },
      { status: 400 }
    );
  }

  // Verify user owns the group
  const { data: group } = await supabase
    .from("secret_groups")
    .select("id")
    .eq("id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const { data: secrets, error } = await supabase
    .from("secrets")
    .select("*")
    .eq("group_id", groupId)
    .eq("environment", env)
    .order("key", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ secrets });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Verify user owns the group
  const { data: group } = await supabase
    .from("secret_groups")
    .select("id")
    .eq("id", body.groupId)
    .eq("user_id", user.id)
    .single();

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const { data: secret, error } = await supabase
    .from("secrets")
    .insert({
      group_id: body.groupId,
      environment: body.environment,
      key: body.key,
      value: body.value,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ secret });
}

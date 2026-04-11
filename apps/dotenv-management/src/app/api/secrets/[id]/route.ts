import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Verify user owns the secret's group
  const { data: secret } = await supabase
    .from("secrets")
    .select("group_id, secret_groups!inner(user_id)")
    .eq("id", id)
    .single();

  if (!secret || (secret.secret_groups as any).user_id !== user.id) {
    return NextResponse.json({ error: "Secret not found" }, { status: 404 });
  }

  const { data: updatedSecret, error } = await supabase
    .from("secrets")
    .update({
      key: body.key,
      value: body.value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ secret: updatedSecret });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user owns the secret's group
  const { data: secret } = await supabase
    .from("secrets")
    .select("group_id, secret_groups!inner(user_id)")
    .eq("id", id)
    .single();

  if (!secret || (secret.secret_groups as any).user_id !== user.id) {
    return NextResponse.json({ error: "Secret not found" }, { status: 404 });
  }

  const { error } = await supabase.from("secrets").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

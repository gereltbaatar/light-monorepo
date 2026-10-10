"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@workspace/sirius-core/supabase/server";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";

export type CategoryActionResult = { error: string } | { ok: true } | undefined;

export async function createCategory(_prev: CategoryActionResult, formData: FormData): Promise<CategoryActionResult> {
  const t = (await getT()).errors;
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "");
  const color = String(formData.get("color") ?? "");
  if (!name) return { error: t.nameEmpty };
  if (name.length > 30) return { error: t.categoryNameTooLong };

  const supabase = await createClient();
  const { count } = await supabase.from("do_categories").select("id", { count: "exact", head: true });
  const { error } = await supabase.from("do_categories").insert({
    name,
    icon: icon in CATEGORY_ICONS ? icon : "tag",
    color: CATEGORY_COLORS.includes(color) ? color : CATEGORY_COLORS.at(-1),
    position: count ?? 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("do_categories").delete().eq("id", id).is("key", null);

  revalidatePath("/", "layout");
}

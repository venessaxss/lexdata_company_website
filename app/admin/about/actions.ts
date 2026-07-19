"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * About page editing — allowed for BOTH admin and manager.
 * requireRole(["manager"]) admits managers, and admins pass every
 * role check via hasRoleAccess. RLS enforces the same rule in the DB
 * (public.is_admin_or_manager in migration 004).
 */
export async function updateAboutSection(formData: FormData) {
  const { profile } = await requireRole(["admin", "manager"]);

  const id = String(formData.get("id") ?? "").trim();
  const returnTo =
    String(formData.get("return_to") ?? "").trim() || "/admin/about";

  if (!id) {
    redirect(`${returnTo}?message=Missing section id`);
  }

  const itemsRaw = String(formData.get("items") ?? "");
  const items = itemsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const supabase = await createClient();

  const { error } = await supabase
    .from("about_sections")
    .upsert({
      id,
      kicker: String(formData.get("kicker") ?? "").trim() || null,
      heading: String(formData.get("heading") ?? "").trim() || null,
      body: String(formData.get("body") ?? "").trim() || null,
      items,
      is_active: formData.get("is_active") === "on",
      updated_at: new Date().toISOString(),
    });

  if (error) {
    redirect(`${returnTo}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/about");
  revalidatePath("/admin/about");
  revalidatePath("/manager/about");

  redirect(
    `${returnTo}?message=${encodeURIComponent(
      `Saved "${id}" (edited by ${profile.full_name ?? profile.id})`
    )}`
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value.length > 0 ? value : null;
}

function numberField(formData: FormData, key: string, fallback = 0) {
  const value = field(formData, key);

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function checkboxField(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function createHomeMediaItem(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const title = field(formData, "title");

  if (!title) {
    redirect("/admin/media?message=Title is required");
  }

  const { error } = await supabase.from("home_media_items").insert({
    title,
    description: nullableField(formData, "description"),
    media_type: field(formData, "media_type") || "image",
    media_url: nullableField(formData, "media_url"),
    button_text: field(formData, "button_text") || "Learn more",
    button_href: field(formData, "button_href") || "/workshops",
    display_order: numberField(formData, "display_order", 0),
    is_active: checkboxField(formData, "is_active"),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/admin/media?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/media");

  redirect("/admin/media?message=Homepage media added");
}

export async function deleteHomeMediaItem(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const id = field(formData, "id");

  if (!id) {
    redirect("/admin/media?message=Missing media ID");
  }

  const { error } = await supabase
    .from("home_media_items")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(`/admin/media?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/media");

  redirect("/admin/media?message=Homepage media deleted");
}
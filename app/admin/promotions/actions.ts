"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createPromotion(formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase.from("promotions").insert({
    badge: String(formData.get("badge") || "").trim() || null,
    title: String(formData.get("title") || "").trim(),
    subtitle: String(formData.get("subtitle") || "").trim() || null,
    image_url: String(formData.get("image_url") || "").trim() || null,
    video_url: String(formData.get("video_url") || "").trim() || null,
    cta_label: String(formData.get("cta_label") || "Learn More").trim(),
    cta_href: String(formData.get("cta_href") || "/courses").trim(),
    sort_order: Number(formData.get("sort_order") || 0),
    is_active: formData.get("is_active") === "on",
    starts_at: String(formData.get("starts_at") || "").trim() || null,
    ends_at: String(formData.get("ends_at") || "").trim() || null,
  });

  if (error) {
    redirect(`/admin/promotions?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/promotions");

  redirect("/admin/promotions?message=Promotion created");
}

export async function updatePromotion(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("promotions")
    .update({
      badge: String(formData.get("badge") || "").trim() || null,
      title: String(formData.get("title") || "").trim(),
      subtitle: String(formData.get("subtitle") || "").trim() || null,
      image_url: String(formData.get("image_url") || "").trim() || null,
      video_url: String(formData.get("video_url") || "").trim() || null,
      cta_label: String(formData.get("cta_label") || "Learn More").trim(),
      cta_href: String(formData.get("cta_href") || "/courses").trim(),
      sort_order: Number(formData.get("sort_order") || 0),
      is_active: formData.get("is_active") === "on",
      starts_at: String(formData.get("starts_at") || "").trim() || null,
      ends_at: String(formData.get("ends_at") || "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/promotions?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/promotions");

  redirect("/admin/promotions?message=Promotion updated");
}

export async function deletePromotion(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const supabase = await createClient();

  const { error } = await supabase.from("promotions").delete().eq("id", id);

  if (error) {
    redirect(`/admin/promotions?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/promotions");

  redirect("/admin/promotions?message=Promotion deleted");
}
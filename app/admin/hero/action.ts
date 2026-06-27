"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminOrManager } from "@/lib/require-admin-or-manager";

async function uploadHeroMedia(file: File | null) {
  if (!file || file.size === 0) return null;

  const supabase = createAdminClient();

  const ext = file.name.split(".").pop() || "bin";
  const filePath = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("home-hero-media")
    .upload(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from("home-hero-media")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function createHeroSlide(formData: FormData) {
  await requireAdminOrManager();

  const supabase = createAdminClient();

  const file = formData.get("media_file") as File | null;
  const uploadedUrl = await uploadHeroMedia(file);

  const manualMediaUrl = String(formData.get("media_url") ?? "").trim();
  const mediaUrl = uploadedUrl || manualMediaUrl || null;

  const { error } = await supabase.from("home_hero_slides").insert({
    badge: String(formData.get("badge") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    primary_button_text: String(formData.get("primary_button_text") ?? "").trim(),
    primary_button_href: String(formData.get("primary_button_href") ?? "").trim(),
    secondary_button_text: String(formData.get("secondary_button_text") ?? "").trim(),
    secondary_button_href: String(formData.get("secondary_button_href") ?? "").trim(),
    media_type: String(formData.get("media_type") ?? "image"),
    media_url: mediaUrl,
    overlay_opacity: Number(formData.get("overlay_opacity") ?? 0.68),
    display_order: Number(formData.get("display_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  });

  if (error) {
    redirect(`/admin/hero?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  revalidatePath("/manager/hero");

  redirect("/admin/hero?message=Hero slide created");
}

export async function updateHeroSlide(formData: FormData) {
  await requireAdminOrManager();

  const supabase = createAdminClient();

  const id = String(formData.get("id") ?? "");
  const currentMediaUrl = String(formData.get("current_media_url") ?? "").trim();

  const file = formData.get("media_file") as File | null;
  const uploadedUrl = await uploadHeroMedia(file);

  const manualMediaUrl = String(formData.get("media_url") ?? "").trim();
  const finalMediaUrl = uploadedUrl || manualMediaUrl || currentMediaUrl || null;

  const { error } = await supabase
    .from("home_hero_slides")
    .update({
      badge: String(formData.get("badge") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      subtitle: String(formData.get("subtitle") ?? "").trim(),
      primary_button_text: String(formData.get("primary_button_text") ?? "").trim(),
      primary_button_href: String(formData.get("primary_button_href") ?? "").trim(),
      secondary_button_text: String(formData.get("secondary_button_text") ?? "").trim(),
      secondary_button_href: String(formData.get("secondary_button_href") ?? "").trim(),
      media_type: String(formData.get("media_type") ?? "image"),
      media_url: finalMediaUrl,
      overlay_opacity: Number(formData.get("overlay_opacity") ?? 0.68),
      display_order: Number(formData.get("display_order") ?? 0),
      is_active: formData.get("is_active") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/hero?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  revalidatePath("/manager/hero");

  redirect("/admin/hero?message=Hero slide updated");
}

export async function deleteHeroSlide(formData: FormData) {
  await requireAdminOrManager();

  const id = String(formData.get("id") ?? "");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("home_hero_slides")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(`/admin/hero?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  revalidatePath("/manager/hero");

  redirect("/admin/hero?message=Hero slide deleted");
}
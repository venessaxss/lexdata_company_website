"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function saveHomepageVideoAction(formData: FormData) {
  const admin = createAdminClient();

  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const titleAr = String(formData.get("title_ar") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const descriptionAr = String(formData.get("description_ar") || "").trim();
  const youtubeUrl = String(formData.get("youtube_url") || "").trim();
  const tag = String(formData.get("tag") || "Featured").trim();
  const displayOrder = Number(formData.get("display_order") || 0);
  const isActive = formData.get("is_active") === "on";

  if (!title || !youtubeUrl) {
    return;
  }

  const payload = {
    title,
    title_ar: titleAr,
    description,
    description_ar: descriptionAr,
    youtube_url: youtubeUrl,
    tag,
    display_order: displayOrder,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    await admin.from("homepage_videos").update(payload).eq("id", id);
  } else {
    await admin.from("homepage_videos").insert({
      ...payload,
      created_at: new Date().toISOString(),
    });
  }

  revalidatePath("/");
}

export async function deleteHomepageVideoAction(formData: FormData) {
  const admin = createAdminClient();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    return;
  }

  await admin.from("homepage_videos").delete().eq("id", id);

  revalidatePath("/");
}
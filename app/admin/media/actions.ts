"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uploadImageFromFormData } from "@/lib/upload";

export async function createMediaItem(formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  let imageUrl: string | null = null;

  try {
    imageUrl = await uploadImageFromFormData(
      formData,
      "image_file",
      "media"
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image upload failed";
    redirect(`/admin/media?message=${encodeURIComponent(message)}`);
  }

  if (!imageUrl) {
    redirect("/admin/media?message=Please upload an image");
  }

  const { error } = await supabase.from("media_items").insert({
    title: String(formData.get("title") || "").trim(),
    media_type: "image",
    url: imageUrl,
    alt: String(formData.get("alt") || "").trim() || null,
    caption: String(formData.get("caption") || "").trim() || null,
    page_area: String(formData.get("page_area") || "home_gallery").trim(),
    sort_order: Number(formData.get("sort_order") || 0),
    is_active: formData.get("is_active") === "on",
  });

  if (error) {
    redirect(`/admin/media?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/media");

  redirect("/admin/media?message=Media item created");
}

export async function deleteMediaItem(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id"));
  const supabase = await createClient();

  await supabase.from("media_items").delete().eq("id", id);

  revalidatePath("/");
  redirect("/admin/media?message=Media item deleted");
}
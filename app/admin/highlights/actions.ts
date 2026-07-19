"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uploadImageFromFormData } from "@/lib/upload";

export async function createHighlight(formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  let imageUrl: string | null = null;

  try {
    imageUrl = await uploadImageFromFormData(
      formData,
      "image_file",
      "session-highlights"
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image upload failed";
    redirect(`/admin/highlights?message=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("session_highlights").insert({
    title: String(formData.get("title") || "").trim(),
    subtitle: String(formData.get("subtitle") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    session_date: String(formData.get("session_date") || "").trim() || null,
    image_url: imageUrl,
    video_url: String(formData.get("video_url") || "").trim() || null,
    location: String(formData.get("location") || "").trim() || null,
    stat_label: String(formData.get("stat_label") || "").trim() || null,
    stat_value: String(formData.get("stat_value") || "").trim() || null,
    cta_label: String(formData.get("cta_label") || "View More").trim(),
    cta_href: String(formData.get("cta_href") || "/workshops").trim(),
    sort_order: Number(formData.get("sort_order") || 0),
    is_active: formData.get("is_active") === "on",
  });

  if (error) {
    redirect(`/admin/highlights?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/highlights");

  redirect("/admin/highlights?message=Highlight created");
}

export async function deleteHighlight(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("session_highlights")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(`/admin/highlights?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/highlights");

  redirect("/admin/highlights?message=Highlight deleted");
}
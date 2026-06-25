"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function updateSiteContent(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_content")
    .update({
      title: String(formData.get("title") || "").trim(),
      body: String(formData.get("body") || "").trim(),
      image_url: String(formData.get("image_url") || "").trim() || null,
      cta_label: String(formData.get("cta_label") || "").trim() || null,
      cta_href: String(formData.get("cta_href") || "").trim() || null,
      is_active: formData.get("is_active") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/content?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/services");
  revalidatePath("/workshops");
  revalidatePath("/admin/content");

  redirect("/admin/content?message=Content updated");
}
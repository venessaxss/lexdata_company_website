"use server";

import { requireAdminOrManager } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

export async function updateHomepageContentAction(formData: FormData) {
  await requireAdminOrManager("/admin/homepage-content");

  const admin = createAdminClient();
  const keys = formData.getAll("key").map(String);

  const rows = keys.map((key, index) => ({
    key,
    label: String(formData.get(`label_${key}`) ?? ""),
    title: String(formData.get(`title_${key}`) ?? ""),
    body: String(formData.get(`body_${key}`) ?? ""),
    href: String(formData.get(`href_${key}`) ?? ""),
    is_active: formData.get(`is_active_${key}`) === "on",
    sort_order: Number(formData.get(`sort_order_${key}`) ?? index),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await admin.from("homepage_content_slots").upsert(rows, {
    onConflict: "key",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/home-v2");
  revalidatePath("/admin/homepage-content");

  redirect("/admin/homepage-content?message=updated");
}
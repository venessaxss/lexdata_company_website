"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdminOrManager() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.role !== "manager") {
    throw new Error("You do not have permission to edit homepage content.");
  }

  return user;
}

export async function updateHomepageContentAction(formData: FormData) {
  await requireAdminOrManager();

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
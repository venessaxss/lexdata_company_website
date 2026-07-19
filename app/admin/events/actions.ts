"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugifyEventTitle } from "@/lib/lexdata-events";

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
    throw new Error("You do not have permission to edit LexData events.");
  }
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function saveLexDataEventAction(formData: FormData) {
  await requireAdminOrManager();

  const admin = createAdminClient();

  const id = readText(formData, "id");
  const title = readText(formData, "title");
  const rawSlug = readText(formData, "slug");
  const slug = slugifyEventTitle(rawSlug || title);

  if (!title || !slug) {
    throw new Error("Title is required.");
  }

  const payload = {
    slug,
    title,
    excerpt: readText(formData, "excerpt"),
    content: readText(formData, "content"),
    category: readText(formData, "category") || "What's new",
    author: readText(formData, "author") || "LexData Team",
    event_date: readText(formData, "event_date") || new Date().toISOString().slice(0, 10),
    poster_url: readText(formData, "poster_url"),
    image_url: readText(formData, "image_url"),
    video_url: readText(formData, "video_url"),
    cta_label: readText(formData, "cta_label") || "Read more",
    cta_href: readText(formData, "cta_href"),
    is_active: formData.get("is_active") === "on",
    is_featured: formData.get("is_featured") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0),
    updated_at: new Date().toISOString(),
  };

  const result = id
    ? await admin.from("lexdata_events").update(payload).eq("id", id)
    : await admin.from("lexdata_events").insert(payload);

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath("/");
  revalidatePath("/blog/whats-new");
  revalidatePath("/admin/events");

  redirect("/admin/events?message=saved");
}

export async function unpublishLexDataEventAction(formData: FormData) {
  await requireAdminOrManager();

  const id = readText(formData, "id");

  if (!id) {
    throw new Error("Missing event id.");
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("lexdata_events")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/blog/whats-new");
  revalidatePath("/admin/events");

  redirect("/admin/events?message=unpublished");
}
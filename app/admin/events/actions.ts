"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminOrManager } from "@/lib/auth";
import { slugifyEventTitle } from "@/lib/lexdata-events";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireEventEditor() {
  const auth = await requireAdminOrManager("/admin/events");

  return {
    user: auth.user,
    profile: auth.profile,
  };
}

export async function saveLexDataEventAction(formData: FormData) {
  await requireEventEditor();

  const admin = createAdminClient();

  const id = readText(formData, "id");
  const title = readText(formData, "title");
  const slugInput = readText(formData, "slug");
  const slug = slugInput || slugifyEventTitle(title);
  const excerpt = readText(formData, "excerpt");
  const content = readText(formData, "content");
  const category = readText(formData, "category") || "What's new";
  const author = readText(formData, "author") || "LexData Team";
  const event_date = readText(formData, "event_date") || new Date().toISOString().slice(0, 10);
  const poster_url = readText(formData, "poster_url");
  const image_url = readText(formData, "image_url");
  const video_url = readText(formData, "video_url");
  const cta_label = readText(formData, "cta_label") || "Read more";
  const cta_href = readText(formData, "cta_href");
  const sort_order = Number(readText(formData, "sort_order") || "0");
  const is_active = formData.get("is_active") === "on";
  const is_featured = formData.get("is_featured") === "on";

  if (!title) {
    throw new Error("Title is required.");
  }

  const payload = {
    title,
    slug,
    excerpt,
    content,
    category,
    author,
    event_date,
    poster_url,
    image_url,
    video_url,
    cta_label,
    cta_href,
    sort_order,
    is_active,
    is_featured,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await admin
      .from("lexdata_events")
      .update(payload)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await admin
      .from("lexdata_events")
      .insert(payload);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/");
  revalidatePath("/blog/whats-new");
  revalidatePath("/admin/events");
}

export async function unpublishLexDataEventAction(formData: FormData) {
  await requireEventEditor();

  const id = readText(formData, "id");

  if (!id) {
    throw new Error("Event ID is required.");
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("lexdata_events")
    .update({
      is_active: false,
      is_featured: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/blog/whats-new");
  revalidatePath("/admin/events");
}
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createWorkshop(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") || title));
  const short_description = String(formData.get("short_description") ?? "").trim();
  const intro = String(formData.get("intro") ?? "").trim();
  const speaker_id = String(formData.get("speaker_id") || "") || null;
  const is_published = formData.get("is_published") === "on";

  const { error } = await supabase.from("workshops").insert({
    title,
    slug,
    short_description,
    intro,
    speaker_id,
    is_published
  });

  if (error) redirect(`/admin/workshops?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/workshops");
  redirect("/admin/workshops");
}

export async function createWorkshopSession(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const workshop_id = String(formData.get("workshop_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const speaker_id = String(formData.get("speaker_id") || "") || null;
  const starts_at = String(formData.get("starts_at") ?? "");
  const ends_at = String(formData.get("ends_at") ?? "");
  const capacityRaw = String(formData.get("capacity") || "");
  const priceRaw = String(formData.get("price_cents") || "0");
  const currency = String(formData.get("currency") || "usd").toLowerCase();
  const meeting_url = String(formData.get("meeting_url") || "") || null;
  const is_published = formData.get("is_published") === "on";

  const { error } = await supabase.from("workshop_sessions").insert({
    workshop_id,
    title,
    speaker_id,
    starts_at: new Date(starts_at).toISOString(),
    ends_at: new Date(ends_at).toISOString(),
    capacity: capacityRaw ? Number(capacityRaw) : null,
    price_cents: Number(priceRaw),
    currency,
    meeting_url,
    is_published
  });

  if (error) redirect(`/admin/workshops?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/workshops");
  redirect("/admin/workshops");
}

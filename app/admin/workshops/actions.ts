"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value.length > 0 ? value : null;
}

function numberField(formData: FormData, key: string, fallback = 0) {
  const value = field(formData, key);

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function checkboxField(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getWorkshopPayload(formData: FormData) {
  const title = field(formData, "title");
  const slug = field(formData, "slug") || slugify(title);

  return {
    title,
    slug,
    level: field(formData, "level") || "Beginner",

    short_description:
      nullableField(formData, "short_description") ||
      nullableField(formData, "summary"),

    description: nullableField(formData, "description"),

    instructor:
      nullableField(formData, "instructor") ||
      nullableField(formData, "speaker"),

    location: nullableField(formData, "location"),
    format: field(formData, "format") || "Online",

    start_date:
      nullableField(formData, "start_date") ||
      nullableField(formData, "date"),

    end_date: nullableField(formData, "end_date"),
    duration: nullableField(formData, "duration"),

    price: numberField(formData, "price", 0),
    currency: field(formData, "currency") || "USD",

    capacity: numberField(formData, "capacity", 0),

    image_url:
      nullableField(formData, "image_url") ||
      nullableField(formData, "cover_url") ||
      nullableField(formData, "thumbnail_url"),

    material_url:
      nullableField(formData, "material_url") ||
      nullableField(formData, "materials_url") ||
      nullableField(formData, "resource_url") ||
      nullableField(formData, "file_url"),

    is_featured: checkboxField(formData, "is_featured"),
    is_published:
      checkboxField(formData, "is_published") ||
      checkboxField(formData, "is_active"),

    updated_at: new Date().toISOString(),
  };
}

export async function createWorkshop(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const title = field(formData, "title");

  if (!title) {
    redirect("/admin/workshops/new?message=Workshop title is required");
  }

  const payload = getWorkshopPayload(formData);

  const { error } = await supabase.from("workshops").insert({
    ...payload,
    created_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/admin/workshops/new?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/workshops");
  revalidatePath("/admin/workshops");

  redirect("/admin/workshops?message=Workshop created");
}

export async function updateWorkshop(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const id = field(formData, "id");
  const title = field(formData, "title");

  if (!id || !title) {
    redirect("/admin/workshops?message=Missing workshop ID or title");
  }

  const payload = getWorkshopPayload(formData);

  const { error } = await supabase
    .from("workshops")
    .update(payload)
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/workshops/${id}/edit?message=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/");
  revalidatePath("/workshops");
  revalidatePath(`/workshops/${payload.slug}`);
  revalidatePath("/admin/workshops");
  revalidatePath(`/admin/workshops/${id}/edit`);

  redirect("/admin/workshops?message=Workshop updated");
}

export async function deleteWorkshop(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const id = field(formData, "id");

  if (!id) {
    redirect("/admin/workshops?message=Missing workshop ID");
  }

  const { error } = await supabase.from("workshops").delete().eq("id", id);

  if (error) {
    redirect(`/admin/workshops?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/workshops");
  revalidatePath("/admin/workshops");

  redirect("/admin/workshops?message=Workshop deleted");
}
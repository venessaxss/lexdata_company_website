"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

const BUCKET = "workshop-posters";
const MAX_POSTER_BYTES = 10 * 1024 * 1024;
const ALLOWED_POSTER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function integer(formData: FormData, key: string, fallback = 0) {
  const parsed = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function adminReturn(
  key: "message" | "error",
  message: string
) {
  redirect(
    `/admin/workshop-notices?${key}=${encodeURIComponent(message)}`
  );
}

function safeFileName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "jpg";
  const base = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "poster"}.${ext}`;
}

async function uploadPoster(
  admin: any,
  noticeId: string,
  file: File
) {
  if (!ALLOWED_POSTER_TYPES.has(file.type)) {
    throw new Error("Poster must be JPG, PNG, or WEBP.");
  }

  if (file.size > MAX_POSTER_BYTES) {
    throw new Error("Poster must be 10 MB or smaller.");
  }

  const path = `${noticeId}/${Date.now()}-${safeFileName(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);

  return {
    posterPath: path,
    posterUrl: data.publicUrl,
  };
}

export async function saveWorkshopNoticeAction(formData: FormData) {
  const auth = await requireAdmin("/admin/workshop-notices");
  const admin = auth.admin;

  const id = text(formData, "id");
  const title = text(formData, "title");
  const summary = text(formData, "summary");
  const dateLabel = text(formData, "date_label");
  const venue = text(formData, "venue");
  const href = text(formData, "href");
  const badge = text(formData, "badge") || "WORKSHOP";
  const sortOrder = integer(formData, "sort_order", 0);
  const isPublished = checked(formData, "is_published");
  const poster = formData.get("poster");

  if (!title) {
    adminReturn("error", "Workshop notice title is required.");
  }

  try {
    let noticeId = id;
    let existingPosterPath: string | null = null;

    if (noticeId) {
      const { data: existing, error: existingError } = await admin
        .from("workshop_notices")
        .select("id, poster_path")
        .eq("id", noticeId)
        .maybeSingle();

      if (existingError) {
        adminReturn("error", existingError.message);
      }

      existingPosterPath = existing?.poster_path || null;

      const { error: updateError } = await admin
        .from("workshop_notices")
        .update({
          title,
          summary,
          date_label: dateLabel,
          venue,
          href: href || null,
          badge,
          sort_order: sortOrder,
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noticeId);

      if (updateError) {
        adminReturn("error", updateError.message);
      }
    } else {
      const { data: created, error: createError } = await admin
        .from("workshop_notices")
        .insert({
          title,
          summary,
          date_label: dateLabel,
          venue,
          href: href || null,
          badge,
          sort_order: sortOrder,
          is_published: isPublished,
        })
        .select("id")
        .single();

      if (createError || !created?.id) {
        adminReturn(
          "error",
          createError?.message || "Could not create workshop notice."
        );
      }

      noticeId = created.id;
    }

    if (poster instanceof File && poster.size > 0) {
      const uploaded = await uploadPoster(admin, noticeId, poster);

      const { error: posterUpdateError } = await admin
        .from("workshop_notices")
        .update({
          poster_url: uploaded.posterUrl,
          poster_path: uploaded.posterPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noticeId);

      if (posterUpdateError) {
        await admin.storage.from(BUCKET).remove([uploaded.posterPath]);
        adminReturn("error", posterUpdateError.message);
      }

      if (existingPosterPath && existingPosterPath !== uploaded.posterPath) {
        await admin.storage.from(BUCKET).remove([existingPosterPath]);
      }
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/workshop-notices");

    adminReturn(
      "message",
      id ? "Workshop poster updated." : "Workshop poster created."
    );
  } catch (error) {
    adminReturn(
      "error",
      error instanceof Error ? error.message : "Could not save workshop poster."
    );
  }
}

export async function deleteWorkshopNoticeAction(formData: FormData) {
  const auth = await requireAdmin("/admin/workshop-notices");
  const admin = auth.admin;
  const id = text(formData, "id");

  if (!id) {
    adminReturn("error", "Missing workshop notice ID.");
  }

  const { data: existing, error: loadError } = await admin
    .from("workshop_notices")
    .select("poster_path")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    adminReturn("error", loadError.message);
  }

  const { error: deleteError } = await admin
    .from("workshop_notices")
    .delete()
    .eq("id", id);

  if (deleteError) {
    adminReturn("error", deleteError.message);
  }

  if (existing?.poster_path) {
    await admin.storage.from(BUCKET).remove([existing.poster_path]);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/workshop-notices");

  adminReturn("message", "Workshop poster deleted.");
}
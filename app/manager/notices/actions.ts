"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRole } from "@/lib/roles";

type NoticePublisherProfile = {
  id: string;
  role?: string | null;
  can_publish_notices?: boolean | null;
};

async function requireNoticePublisher() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/manager/notices");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, can_publish_notices")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/dashboard");
  }

  const normalizedRole = normalizeRole(profile.role);

  const canPublish =
    normalizedRole === "admin" ||
    normalizedRole === "manager" ||
    (normalizedRole === "staff" && profile.can_publish_notices === true);

  if (!canPublish) {
    redirect("/unauthorized");
  }

  return profile as NoticePublisherProfile;
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value.length > 0 ? value : null;
}

function numberField(formData: FormData, key: string, fallback = 0) {
  const value = field(formData, key);

  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function checkboxField(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function createNotice(formData: FormData) {
  const actor = await requireNoticePublisher();
  const supabase = createAdminClient();

  const title = field(formData, "title");

  if (!title) {
    redirect("/manager/notices?message=Title is required");
  }

  const { error } = await supabase.from("notices").insert({
    title,
    summary: nullableField(formData, "summary"),
    body: nullableField(formData, "body"),

    notice_type: field(formData, "notice_type") || "announcement",
    media_type: field(formData, "media_type") || "none",
    media_url: nullableField(formData, "media_url"),

    button_text: field(formData, "button_text") || "Read more",
    button_href: nullableField(formData, "button_href"),

    audience: field(formData, "audience") || "public",

    priority: numberField(formData, "priority", 0),
    is_published: checkboxField(formData, "is_published"),
    is_featured: checkboxField(formData, "is_featured"),

    publish_at: nullableField(formData, "publish_at") || new Date().toISOString(),
    expire_at: nullableField(formData, "expire_at"),

    created_by: actor.id,
    updated_by: actor.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/manager/notices?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/manager/notices");

  redirect("/manager/notices?message=Notice published");
}

export async function updateNotice(formData: FormData) {
  const actor = await requireNoticePublisher();
  const supabase = createAdminClient();

  const id = field(formData, "id");

  if (!id) {
    redirect("/manager/notices?message=Missing notice ID");
  }

  const title = field(formData, "title");

  if (!title) {
    redirect("/manager/notices?message=Title is required");
  }

  const { error } = await supabase
    .from("notices")
    .update({
      title,
      summary: nullableField(formData, "summary"),
      body: nullableField(formData, "body"),

      notice_type: field(formData, "notice_type") || "announcement",
      media_type: field(formData, "media_type") || "none",
      media_url: nullableField(formData, "media_url"),

      button_text: field(formData, "button_text") || "Read more",
      button_href: nullableField(formData, "button_href"),

      audience: field(formData, "audience") || "public",

      priority: numberField(formData, "priority", 0),
      is_published: checkboxField(formData, "is_published"),
      is_featured: checkboxField(formData, "is_featured"),

      publish_at: nullableField(formData, "publish_at"),
      expire_at: nullableField(formData, "expire_at"),

      updated_by: actor.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/manager/notices?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/manager/notices");

  redirect("/manager/notices?message=Notice updated");
}

export async function deleteNotice(formData: FormData) {
  await requireNoticePublisher();

  const supabase = createAdminClient();

  const id = field(formData, "id");

  if (!id) {
    redirect("/manager/notices?message=Missing notice ID");
  }

  const { error } = await supabase.from("notices").delete().eq("id", id);

  if (error) {
    redirect(`/manager/notices?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/manager/notices");

  redirect("/manager/notices?message=Notice deleted");
}
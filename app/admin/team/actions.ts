"use server";

import { requireAdminOrManager } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/dr\.|professor\.|prof\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function uploadTeamMedia(file: File | null, folder: string) {
  if (!file || file.size === 0) return null;

  const supabase = createAdminClient();

  const ext = file.name.split(".").pop() || "bin";
  const filePath = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("team-media")
    .upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("team-media").getPublicUrl(filePath);

  return data.publicUrl;
}

export async function createTeamMember(formData: FormData) {
  await requireAdminOrManager();

  const supabase = createAdminClient();
  const returnTo = field(formData, "return_to") || "/admin/team";

  const fullName = field(formData, "full_name") || field(formData, "name");
  const roleTitle =
    field(formData, "position_title") ||
    field(formData, "role_title") ||
    field(formData, "role");

  if (!fullName) {
    redirect(`${returnTo}?message=Name is required`);
  }

  const imageFile =
    (formData.get("media_file") as File | null) ||
    (formData.get("photo") as File | null);

  const videoFile = formData.get("video_file") as File | null;

  const uploadedImageUrl = await uploadTeamMedia(imageFile, "images");
  const uploadedVideoUrl = await uploadTeamMedia(videoFile, "videos");

  const manualMediaUrl =
    field(formData, "media_url") ||
    field(formData, "photo_url") ||
    field(formData, "profile_image_url");

  const manualVideoUrl = field(formData, "video_url");

  const finalMediaUrl = uploadedImageUrl || manualMediaUrl || null;
  const finalVideoUrl = uploadedVideoUrl || manualVideoUrl || null;

  const profileSlug = field(formData, "profile_slug") || slugify(fullName);
  const displayOrder = Number(field(formData, "display_order") || field(formData, "sort_order") || 0);

  const { error } = await supabase.from("team_members").insert({
    name: fullName,
    full_name: fullName,
    role: roleTitle || "Team Member",
    role_title: roleTitle || "Team Member",
    position_title: roleTitle || "Team Member",
    section: field(formData, "section") || "Core Team",
    institution: field(formData, "institution") || null,
    organization: field(formData, "organization") || null,
    bio: field(formData, "bio") || null,
    photo_url: finalMediaUrl,
    profile_image_url: finalMediaUrl,
    media_type: field(formData, "media_type") || "image",
    media_url: finalMediaUrl,
    video_url: finalVideoUrl,
    style_preset: field(formData, "style_preset") || "navy",
    profile_highlight: field(formData, "profile_highlight") || null,
    profile_cta: field(formData, "profile_cta") || "View Profile",
    profile_slug: profileSlug,
    initials: field(formData, "initials") || initialsFromName(fullName),
    display_order: displayOrder,
    sort_order: displayOrder,
    is_active: formData.get("is_active") === "on",
    is_featured: formData.get("is_featured") === "on",
  });

  if (error) {
    redirect(`${returnTo}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/admin/team");
  revalidatePath("/manager/team");

  redirect(`${returnTo}?message=Team member created`);
}

export async function updateTeamMember(formData: FormData) {
  await requireAdminOrManager();

  const supabase = createAdminClient();
  const returnTo = field(formData, "return_to") || "/admin/team";

  const id = field(formData, "id");
  const fullName = field(formData, "full_name") || field(formData, "name");
  const roleTitle =
    field(formData, "position_title") ||
    field(formData, "role_title") ||
    field(formData, "role");

  if (!id || !fullName) {
    redirect(`${returnTo}?message=Missing member ID or name`);
  }

  const imageFile =
    (formData.get("media_file") as File | null) ||
    (formData.get("photo") as File | null);

  const videoFile = formData.get("video_file") as File | null;

  const uploadedImageUrl = await uploadTeamMedia(imageFile, "images");
  const uploadedVideoUrl = await uploadTeamMedia(videoFile, "videos");

  const currentMediaUrl =
    field(formData, "current_media_url") ||
    field(formData, "current_photo_url") ||
    field(formData, "photo_url") ||
    field(formData, "profile_image_url");

  const currentVideoUrl = field(formData, "current_video_url");

  const manualMediaUrl =
    field(formData, "media_url") ||
    field(formData, "photo_url") ||
    field(formData, "profile_image_url");

  const manualVideoUrl = field(formData, "video_url");

  const finalMediaUrl =
    uploadedImageUrl || manualMediaUrl || currentMediaUrl || null;

  const finalVideoUrl =
    uploadedVideoUrl || manualVideoUrl || currentVideoUrl || null;

  const profileSlug = field(formData, "profile_slug") || slugify(fullName);
  const displayOrder = Number(field(formData, "display_order") || field(formData, "sort_order") || 0);

  const { error } = await supabase
    .from("team_members")
    .update({
      name: fullName,
      full_name: fullName,
      role: roleTitle || "Team Member",
      role_title: roleTitle || "Team Member",
      position_title: roleTitle || "Team Member",
      section: field(formData, "section") || "Core Team",
      institution: field(formData, "institution") || null,
      organization: field(formData, "organization") || null,
      bio: field(formData, "bio") || null,
      photo_url: finalMediaUrl,
      profile_image_url: finalMediaUrl,
      media_type: field(formData, "media_type") || "image",
      media_url: finalMediaUrl,
      video_url: finalVideoUrl,
      style_preset: field(formData, "style_preset") || "navy",
      profile_highlight: field(formData, "profile_highlight") || null,
      profile_cta: field(formData, "profile_cta") || "View Profile",
      profile_slug: profileSlug,
      initials: field(formData, "initials") || initialsFromName(fullName),
      display_order: displayOrder,
      sort_order: displayOrder,
      is_active: formData.get("is_active") === "on",
      is_featured: formData.get("is_featured") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`${returnTo}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath(`/team/${profileSlug}`);
  revalidatePath("/admin/team");
  revalidatePath("/manager/team");

  redirect(`${returnTo}?message=Team member updated`);
}

export async function deleteTeamMember(formData: FormData) {
  await requireAdminOrManager();

  const supabase = createAdminClient();
  const returnTo = field(formData, "return_to") || "/admin/team";
  const id = field(formData, "id");

  if (!id) {
    redirect(`${returnTo}?message=Missing member ID`);
  }

  const { error } = await supabase.from("team_members").delete().eq("id", id);

  if (error) {
    redirect(`${returnTo}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/admin/team");
  revalidatePath("/manager/team");

  redirect(`${returnTo}?message=Team member deleted`);
}

export async function reorderTeamMembers(formData: FormData) {
  await requireAdminOrManager();

  const supabase = createAdminClient();
  const returnTo = field(formData, "return_to") || "/manager/team";

  let order: { id: string; sort_order: number }[] = [];

  try {
    order = JSON.parse(field(formData, "order") || "[]");
  } catch {
    redirect(`${returnTo}?message=Invalid team order data`);
  }

  if (!Array.isArray(order) || order.length === 0) {
    redirect(`${returnTo}?message=No team order changes submitted`);
  }

  for (const item of order) {
    if (!item.id) continue;

    await supabase
      .from("team_members")
      .update({
        sort_order: item.sort_order,
        display_order: item.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  }

  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/admin/team");
  revalidatePath("/manager/team");

  redirect(`${returnTo}?message=Team order updated`);
}

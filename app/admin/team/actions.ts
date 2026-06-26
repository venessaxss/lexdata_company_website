"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function uploadTeamPhoto(file: File | null) {
  if (!file || file.size === 0) return null;

  const supabase = createAdminClient();

  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("team-photos")
    .upload(filePath, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from("team-photos")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function createTeamMember(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const full_name = String(formData.get("full_name") ?? "").trim();
  const role_title = String(formData.get("role_title") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const display_order = Number(formData.get("display_order") ?? 0);
  const is_active = formData.get("is_active") === "on";

  const photoFile = formData.get("photo") as File | null;
  const uploadedPhotoUrl = await uploadTeamPhoto(photoFile);

  const manualPhotoUrl = String(formData.get("photo_url") ?? "").trim();

  if (!full_name) {
    redirect("/admin/team/new?message=Name is required");
  }

  const { error } = await supabase.from("team_members").insert({
    full_name,
    role_title,
    bio,
    photo_url: uploadedPhotoUrl || manualPhotoUrl || null,
    display_order,
    is_active,
  });

  if (error) {
    redirect(`/admin/team/new?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/team");
  revalidatePath("/admin/team");
  redirect("/admin/team?message=Team member created");
}

export async function updateTeamMember(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const id = String(formData.get("id") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role_title = String(formData.get("role_title") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const display_order = Number(formData.get("display_order") ?? 0);
  const is_active = formData.get("is_active") === "on";

  const currentPhotoUrl = String(formData.get("current_photo_url") ?? "").trim();
  const manualPhotoUrl = String(formData.get("photo_url") ?? "").trim();

  const photoFile = formData.get("photo") as File | null;
  const uploadedPhotoUrl = await uploadTeamPhoto(photoFile);

  if (!id || !full_name) {
    redirect("/admin/team?message=Missing member ID or name");
  }

  const { error } = await supabase
    .from("team_members")
    .update({
      full_name,
      role_title,
      bio,
      photo_url: uploadedPhotoUrl || manualPhotoUrl || currentPhotoUrl || null,
      display_order,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/team/${id}/edit?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/team");
  revalidatePath("/admin/team");
  redirect("/admin/team?message=Team member updated");
}

export async function deleteTeamMember(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(`/admin/team?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/team");
  revalidatePath("/admin/team");
  redirect("/admin/team?message=Team member deleted");
}
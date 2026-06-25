"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uploadImageFromFormData } from "@/lib/upload";

export async function createTeamMember(formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  let imageUrl: string | null = null;

  try {
    imageUrl = await uploadImageFromFormData(
      formData,
      "image_file",
      "team-members"
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image upload failed";
    redirect(`/admin/team-members?message=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("team_members").insert({
    name: String(formData.get("name") || "").trim(),
    role: String(formData.get("role") || "").trim(),
    group_name: String(formData.get("group_name") || "Core Team").trim(),
    affiliation: String(formData.get("affiliation") || "").trim() || null,
    bio: String(formData.get("bio") || "").trim() || null,
    image_url: imageUrl,
    sort_order: Number(formData.get("sort_order") || 0),
    is_featured: formData.get("is_featured") === "on",
    is_active: formData.get("is_active") === "on",
  });

  if (error) {
    redirect(`/admin/team-members?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/admin/team-members");

  redirect("/admin/team-members?message=Team member created");
}

export async function deleteTeamMember(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const supabase = await createClient();

  const { error } = await supabase.from("team_members").delete().eq("id", id);

  if (error) {
    redirect(`/admin/team-members?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/admin/team-members");

  redirect("/admin/team-members?message=Team member deleted");
}
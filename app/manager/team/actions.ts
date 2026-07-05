"use server";

import { Buffer } from "buffer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/roles";

const TEAM_PHOTOS_BUCKET = "team-photos";

function cleanRedirectMessage(message: string) {
  return encodeURIComponent(message);
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function requireManagerOrAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/manager/team");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = normalizeRole(profile?.role);

  if (role !== "admin" && role !== "manager") {
    redirect("/dashboard");
  }

  return {
    user,
    admin,
    role,
  };
}

async function uploadTeamPhoto(file: File, memberId: string) {
  if (!file || file.size === 0) {
    return null;
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  if (file.type && !allowedTypes.includes(file.type)) {
    throw new Error("Please upload JPG, PNG, or WEBP image.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Team photo must be under 8MB.");
  }

  const admin = createAdminClient();

  const safeName = sanitizeFileName(file.name || "team-photo");
  const storagePath = `${memberId}/${Date.now()}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await admin.storage
    .from(TEAM_PHOTOS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = admin.storage
    .from(TEAM_PHOTOS_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function saveTeamMemberAction(formData: FormData) {
  const { user, admin } = await requireManagerOrAdmin();

  const id = String(formData.get("id") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const linkedinUrl = String(formData.get("linkedin_url") || "").trim();
  const websiteUrl = String(formData.get("website_url") || "").trim();
  const displayOrder = Number(formData.get("display_order") || 0);
  const isPublished = String(formData.get("is_published") || "") === "on";
  const photoFile = formData.get("photo") as File | null;

  if (!fullName) {
    redirect(
      `/manager/team?message=${cleanRedirectMessage("Full name is required")}`
    );
  }

  try {
    let memberId = id;

    if (!memberId) {
      const { data: created, error: createError } = await admin
        .from("team_members")
        .insert({
          full_name: fullName,
          title: title || null,
          bio: bio || null,
          email: email || null,
          linkedin_url: linkedinUrl || null,
          website_url: websiteUrl || null,
          display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
          is_published: isPublished,
          created_by: user.id,
          updated_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createError) {
        throw new Error(createError.message);
      }

      memberId = created.id;
    }

    const photoUrl =
      photoFile && photoFile.size > 0
        ? await uploadTeamPhoto(photoFile, memberId)
        : null;

    const updatePayload: Record<string, unknown> = {
      full_name: fullName,
      title: title || null,
      bio: bio || null,
      email: email || null,
      linkedin_url: linkedinUrl || null,
      website_url: websiteUrl || null,
      display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
      is_published: isPublished,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    if (photoUrl) {
      updatePayload.photo_url = photoUrl;
    }

    const { error: updateError } = await admin
      .from("team_members")
      .update(updatePayload)
      .eq("id", memberId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath("/manager/team");
    revalidatePath("/team");
    revalidatePath("/");

    redirect(
      `/manager/team?message=${cleanRedirectMessage(
        "Team member saved successfully"
      )}`
    );
  } catch (error) {
    redirect(
      `/manager/team?message=${cleanRedirectMessage(
        error instanceof Error ? error.message : "Could not save team member"
      )}`
    );
  }
}

export async function deleteTeamMemberAction(formData: FormData) {
  const { admin } = await requireManagerOrAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect(
      `/manager/team?message=${cleanRedirectMessage("Missing team member id")}`
    );
  }

  const { error } = await admin.from("team_members").delete().eq("id", id);

  if (error) {
    redirect(
      `/manager/team?message=${cleanRedirectMessage(error.message)}`
    );
  }

  revalidatePath("/manager/team");
  revalidatePath("/team");
  revalidatePath("/");

  redirect(
    `/manager/team?message=${cleanRedirectMessage("Team member deleted")}`
  );
}
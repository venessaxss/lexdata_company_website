"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = ["student", "speaker", "manager", "admin"] as const;
type AppRole = (typeof allowedRoles)[number];

function isValidRole(role: string): role is AppRole {
  return allowedRoles.includes(role as AppRole);
}

export async function updateUserRole(formData: FormData) {
  const currentUser = await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!userId || !isValidRole(role)) {
    redirect("/admin/users?message=Invalid user or role");
  }

  // Safety: do not accidentally remove your own admin access
  if (userId === currentUser.id && role !== "admin") {
    redirect("/admin/users?message=You cannot remove your own admin role");
  }

  const supabaseAdmin = createAdminClient();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    redirect(`/admin/users?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users?message=Role updated successfully");
}
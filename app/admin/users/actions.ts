"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { APP_ROLES } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export async function updateUserRole(formData: FormData) {
  const { user } = await requireRole(["admin"]);
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "student");

  if (!id) {
    redirect("/admin/users?message=Missing user id");
  }

  if (!APP_ROLES.includes(role as any)) {
    redirect("/admin/users?message=Invalid role");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role,
      role_changed_at: new Date().toISOString(),
      role_changed_by: user.id
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/users?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users?message=Role updated");
}

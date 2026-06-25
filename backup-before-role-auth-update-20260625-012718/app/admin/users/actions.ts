"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const allowedRoles = ["student", "instructor", "admin"];

export async function updateUserRole(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const role = String(formData.get("role") || "");

  if (!id || !allowedRoles.includes(role)) {
    redirect("/admin/users?message=Invalid user or role");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/users?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users?message=User role updated");
}
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = ["member", "speaker", "manager", "staff", "admin"] as const;
type AppRole = (typeof allowedRoles)[number];

function isValidRole(role: string): role is AppRole {
  return allowedRoles.includes(role as AppRole);
}

function safeUsersReturnTo(value: string) {
  try {
    const url = new URL(value, "https://lexdata.local");

    if (url.origin === "https://lexdata.local" && url.pathname === "/admin/users") {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // Use the safe default below.
  }

  return "/admin/users";
}

function returnWithMessage(returnTo: string, message: string) {
  const url = new URL(safeUsersReturnTo(returnTo), "https://lexdata.local");
  url.searchParams.set("message", message);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

export async function updateUserRole(formData: FormData) {
  const currentUser = await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  const returnTo = safeUsersReturnTo(String(formData.get("return_to") ?? ""));

  if (!userId || !isValidRole(role)) {
    redirect(returnWithMessage(returnTo, "Invalid user or role"));
  }

  // Safety: do not accidentally remove your own admin access
  if (userId === currentUser.id && role !== "admin") {
    redirect(returnWithMessage(returnTo, "You cannot remove your own admin role"));
  }

  const supabaseAdmin = createAdminClient();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    redirect(returnWithMessage(returnTo, error.message));
  }

  revalidatePath("/admin/users");
  redirect(returnWithMessage(returnTo, "Role updated successfully"));
}

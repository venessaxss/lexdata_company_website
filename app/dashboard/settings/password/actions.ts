"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function changePassword(formData: FormData) {
  const password = field(formData, "password");
  const confirmPassword = field(formData, "confirm_password");

  if (!password || !confirmPassword) {
    redirect(
      "/dashboard/settings/password?message=Please fill in both password fields"
    );
  }

  if (password.length < 8) {
    redirect(
      "/dashboard/settings/password?message=Password must be at least 8 characters"
    );
  }

  if (password !== confirmPassword) {
    redirect("/dashboard/settings/password?message=Passwords do not match");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fdashboard%2Fsettings%2Fpassword%2Factions.ts");
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(
      `/dashboard/settings/password?message=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/dashboard/settings/password?message=Password changed successfully");
}
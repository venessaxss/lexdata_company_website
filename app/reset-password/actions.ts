"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function resetPassword(formData: FormData) {
  const password = field(formData, "password");
  const confirmPassword = field(formData, "confirm_password");

  if (!password || !confirmPassword) {
    redirect("/reset-password?message=Please fill in both password fields");
  }

  if (password.length < 8) {
    redirect("/reset-password?message=Password must be at least 8 characters");
  }

  if (password !== confirmPassword) {
    redirect("/reset-password?message=Passwords do not match");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(`/reset-password?message=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();

  redirect("/login?message=Password updated. Please login with your new password.");
}
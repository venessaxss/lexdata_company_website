"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return "http://localhost:3000";
  }

  return siteUrl.replace(/\/$/, "");
}

export async function sendPasswordResetEmail(formData: FormData) {
  const email = field(formData, "email");

  if (!email) {
    redirect("/forgot-password?message=Email is required");
  }

  const siteUrl = getSiteUrl();

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?message=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/forgot-password?message=Password reset email sent. Please check your inbox."
  );
}
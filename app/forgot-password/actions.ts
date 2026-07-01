"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function sendPasswordResetEmail(formData: FormData) {
  const email = field(formData, "email");

  if (!email) {
    redirect("/forgot-password?message=Email is required");
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") || process.env.NEXT_PUBLIC_SITE_URL;

  if (!origin) {
    redirect("/forgot-password?message=Missing site URL");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?message=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/forgot-password?message=Password reset email sent. Please check your inbox."
  );
}

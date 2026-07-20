"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function safeNextPath(value: string) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

export async function loginAction(formData: FormData) {
  const email = readText(formData, "email");
  const password = readText(formData, "password");
  const next = safeNextPath(readText(formData, "next") || readText(formData, "redirect"));

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Please enter your email and password.")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signupAction(formData: FormData) {
  const email = readText(formData, "email");
  const password = readText(formData, "password");
  const confirmPassword = readText(formData, "confirm_password");
  const fullName = readText(formData, "full_name");
  const next = safeNextPath(readText(formData, "next") || "/dashboard");

  if (confirmPassword && confirmPassword !== password) {
    redirect(`/register?message=${encodeURIComponent("Passwords do not match")}`);
  }

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Please enter your email and password.")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: fullName ? { data: { full_name: fullName } } : undefined,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  revalidatePath("/", "layout");
  redirect(next);
}


function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000"
  );
}

export async function loginWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${getBaseUrl()}/auth/callback?next=/dashboard` },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) redirect(data.url);
  redirect("/login?error=Google login did not return a URL");
}

export async function loginWithGithub() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${getBaseUrl()}/auth/callback?next=/dashboard` },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) redirect(data.url);
  redirect("/login?error=GitHub login did not return a URL");
}

export async function loginWithPassword(formData: FormData) {
  return loginAction(formData);
}

export async function registerWithPassword(formData: FormData) {
  return signupAction(formData);
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

async function getOrigin() {
  const headerStore = await headers();
  return (
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

export async function loginWithPassword(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?message=Please enter both email and password");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function registerWithPassword(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!email || !password) {
    redirect("/register?message=Please enter email and password");
  }

  if (password.length < 8) {
    redirect("/register?message=Password must be at least 8 characters");
  }

  if (password !== confirmPassword) {
    redirect("/register?message=Passwords do not match");
  }

  const origin = await getOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: {
        full_name: fullName || email.split("@")[0]
      }
    }
  });

  if (error) {
    redirect(`/register?message=${encodeURIComponent(error.message)}`);
  }

  // If Supabase email confirmation is OFF, a session is returned and the user can enter directly.
  if (data.session) {
    redirect("/dashboard");
  }

  // If email confirmation is ON, Supabase still sends an email. Turn it OFF to avoid email limits during development.
  redirect(
    "/login?message=Account created. If email confirmation is enabled, confirm your email before logging in."
  );
}

export async function loginWithGoogle() {
  const origin = await getOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`
    }
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect("/login?message=Could not start Google login");
}

export async function loginWithGithub() {
  const origin = await getOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`
    }
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect("/login?message=Could not start GitHub login");
}

// Keep this as backup only. Magic links are useful, but they hit Supabase email limits quickly.
export async function loginWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/login?message=Please enter your email");
  }

  const headerStore = await headers();

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    headerStore.get("origin") ||
    "http://localhost:3000";

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Check your email for the magic login link");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

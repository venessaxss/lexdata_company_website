"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setDurableAppSession } from "@/lib/app-session";

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
  const next = safeNextPath(
    readText(formData, "next") || readText(formData, "redirect")
  );

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Please enter your email and password."
      )}&next=${encodeURIComponent(next)}`
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect(
      `/login?error=${encodeURIComponent(
        error?.message || "Login failed."
      )}&next=${encodeURIComponent(next)}`
    );
  }

  await setDurableAppSession({
    id: data.user.id,
    email: data.user.email,
  });

  revalidatePath("/", "layout");
  redirect(`/auth/session-ready?next=${encodeURIComponent(next)}`);
}

export async function signupAction(formData: FormData) {
  const email = readText(formData, "email");
  const password = readText(formData, "password");
  const next = safeNextPath(readText(formData, "next") || "/dashboard");

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Please enter your email and password."
      )}&next=${encodeURIComponent(next)}`
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(
        next
      )}`
    );
  }

  if (data.session && data.user) {
    await setDurableAppSession({
      id: data.user.id,
      email: data.user.email,
    });

    revalidatePath("/", "layout");
    redirect(`/auth/session-ready?next=${encodeURIComponent(next)}`);
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Account created. Confirm your email if confirmation is enabled, then log in."
    )}&next=${encodeURIComponent(next)}`
  );
}
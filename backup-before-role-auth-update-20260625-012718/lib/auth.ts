import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "student" | "speaker" | "manager" | "admin";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_url,role")
    .eq("id", data.user.id)
    .single();

  return profile;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.role || !allowedRoles.includes(profile.role as AppRole)) {
    redirect("/dashboard");
  }

  return { user: userData.user, role: profile.role as AppRole };
}

export async function requireAdmin() {
  const { user } = await requireRole(["admin"]);
  return user;
}

export async function requireSpeakerOrAdmin() {
  return requireRole(["speaker", "admin"]);
}

export async function requireManagerOrAdmin() {
  return requireRole(["manager", "admin"]);
}

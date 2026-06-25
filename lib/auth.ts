import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppRole, hasRoleAccess, normalizeRole } from "@/lib/roles";

export type { AppRole } from "@/lib/roles";

export type CurrentProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
};

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_url,role")
    .eq("id", userData.user.id)
    .single();

  return {
    id: userData.user.id,
    full_name: profile?.full_name ?? userData.user.email ?? null,
    avatar_url: profile?.avatar_url ?? null,
    role: normalizeRole(profile?.role)
  };
}

export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login?message=Please login first");
  }

  return data.user;
}

export async function requireProfile() {
  const user = await requireUser();
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?message=Profile not found. Please login again.");
  }

  return { user, profile };
}

export async function requireRole(allowedRoles: AppRole[]) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?message=Please login first");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_url,role")
    .eq("id", userData.user.id)
    .single();

  const role = normalizeRole(profile?.role);

  if (!hasRoleAccess(role, allowedRoles)) {
    redirect(`/unauthorized?required=${encodeURIComponent(allowedRoles.join(", "))}`);
  }

  return {
    user: userData.user,
    profile: {
      id: userData.user.id,
      full_name: profile?.full_name ?? userData.user.email ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role
    }
  };
}

export async function requireAdmin() {
  const { user } = await requireRole(["admin"]);
  return user;
}

export async function requireSpeakerOrAdmin() {
  return requireRole(["speaker"]);
}

export async function requireManagerOrAdmin() {
  return requireRole(["manager"]);
}

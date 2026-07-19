import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppRole =
  | "admin"
  | "manager"
  | "speaker"
  | "staff"
  | "member"
  | "user"
  | string;

export type CurrentProfile = {
  id: string;
  email?: string | null;
  role?: AppRole | null;
  full_name?: string | null;
  name?: string | null;

  // Compatibility aliases for older code:
  user?: any;
  profile?: CurrentProfile | null;
};

export function normalizeRole(role?: string | null) {
  return String(role || "member").trim().toLowerCase();
}

function withCompatibilityAliases(profile: CurrentProfile, user?: any) {
  return {
    ...profile,
    user: user || null,
    profile,
  } as CurrentProfile;
}

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const current: CurrentProfile = {
    ...(profile || {}),
    id: user.id,
    email: user.email,
    role: normalizeRole(profile?.role),
  };

  return withCompatibilityAliases(current, user);
}

export async function requireProfile() {
  const user = await requireUser();

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const current: CurrentProfile = {
    ...(profile || {}),
    id: user.id,
    email: user.email,
    role: normalizeRole(profile?.role),
  };

  return withCompatibilityAliases(current, user);
}

export async function requireRole(allowedRoles: string[]) {
  const current = await requireProfile();
  const role = normalizeRole(current.role);
  const allowed = allowedRoles.map((item) => normalizeRole(item));

  if (!allowed.includes(role)) {
    redirect("/unauthorized");
  }

  return current;
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}

export async function requireManager() {
  return requireRole(["manager", "admin"]);
}

export async function requireAdminOrManager() {
  return requireRole(["admin", "manager"]);
}

export async function requireManagerOrAdmin() {
  return requireRole(["manager", "admin"]);
}

export async function requireSpeaker() {
  return requireRole(["speaker", "admin"]);
}

export async function requireSpeakerOrAdmin() {
  return requireRole(["speaker", "admin"]);
}

export async function requireStaffOrAdmin() {
  return requireRole(["staff", "manager", "admin"]);
}

export async function getUserRole() {
  const profile = await getCurrentProfile();
  return normalizeRole(profile?.role);
}

export async function isAdmin() {
  const role = await getUserRole();
  return role === "admin";
}

export async function isManagerOrAdmin() {
  const role = await getUserRole();
  return role === "manager" || role === "admin";
}
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

export type AuthContext = {
  id: string;
  email?: string | null;
  role: AppRole;
  full_name?: string | null;
  name?: string | null;

  // Backward compatibility for old code:
  user?: any;
  profile?: any;
};

export function normalizeRole(role?: string | null) {
  return String(role || "member").trim().toLowerCase();
}

function envAdminEmails() {
  return String(process.env.LEXDATA_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function roleWithAdminOverride(email?: string | null, role?: string | null) {
  const normalized = normalizeRole(role);

  if (email && envAdminEmails().includes(email.toLowerCase())) {
    return "admin";
  }

  return normalized;
}

function withAliases(context: AuthContext) {
  return {
    ...context,
    profile: context,
    user: context.user || null,
  };
}

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(next = "/dashboard") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
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

  const role = roleWithAdminOverride(user.email, profile?.role);

  const context: AuthContext = {
    ...(profile || {}),
    id: user.id,
    email: user.email,
    role,
    user,
  };

  return withAliases(context);
}

export async function requireProfile(next = "/dashboard") {
  const user = await requireUser(next);

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const role = roleWithAdminOverride(user.email, profile?.role);

  const context: AuthContext = {
    ...(profile || {}),
    id: user.id,
    email: user.email,
    role,
    user,
  };

  return withAliases(context);
}

export async function requireRole(allowedRoles: string[], next = "/dashboard") {
  const context = await requireProfile(next);
  const role = normalizeRole(context.role);
  const allowed = allowedRoles.map((item) => normalizeRole(item));

  // Admin can access all admin/manager/speaker/member areas.
  if (role === "admin") {
    return context;
  }

  // Manager can access manager-level areas.
  if (role === "manager" && allowed.includes("manager")) {
    return context;
  }

  if (!allowed.includes(role)) {
    redirect("/unauthorized");
  }

  return context;
}

export async function requireAdmin(next = "/admin") {
  return requireRole(["admin"], next);
}

export async function requireManager(next = "/manager") {
  return requireRole(["admin", "manager"], next);
}

export async function requireAdminOrManager(next = "/admin") {
  return requireRole(["admin", "manager"], next);
}

export async function requireManagerOrAdmin(next = "/manager") {
  return requireRole(["admin", "manager"], next);
}

export async function requireSpeaker(next = "/speaker") {
  return requireRole(["admin", "speaker"], next);
}

export async function requireSpeakerOrAdmin(next = "/speaker") {
  return requireRole(["admin", "speaker"], next);
}

export async function requireStaffOrAdmin(next = "/admin") {
  return requireRole(["admin", "manager", "staff"], next);
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
  return role === "admin" || role === "manager";
}
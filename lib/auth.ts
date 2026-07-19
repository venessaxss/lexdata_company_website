import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppRole, hasRoleAccess, normalizeRole } from "@/lib/roles";

export type { AppRole } from "@/lib/roles";

export type AuthContext = {
  id: string;
  email?: string | null;
  role: AppRole | string;
  full_name?: string | null;
  avatar_url?: string | null;
  name?: string | null;
  display_name?: string | null;
  user: any;
  profile: any;
  admin: ReturnType<typeof createAdminClient>;
};

export { normalizeRole };

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

function makeContext(
  user: any,
  profile: any,
  admin: ReturnType<typeof createAdminClient>
): AuthContext {
  const role = roleWithAdminOverride(user?.email, profile?.role);

  const context = {
    ...(profile || {}),
    id: user.id,
    email: user.email,
    role,
    full_name: profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email ?? null,
    avatar_url: profile?.avatar_url ?? null,
    user,
    admin,
    profile: null,
  } as AuthContext;

  context.profile = context;
  return context;
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

  if (!user) return null;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return makeContext(user, profile, admin);
}

export async function requireProfile(next = "/dashboard") {
  const user = await requireUser(next);
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return makeContext(user, profile, admin);
}

export async function requireRole(allowedRoles: (AppRole | string)[], next = "/dashboard") {
  const context = await requireProfile(next);
  const role = normalizeRole(String(context.role));

  if (!hasRoleAccess(role, allowedRoles)) {
    redirect(`/unauthorized?required=${encodeURIComponent(allowedRoles.join(", "))}`);
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
  return normalizeRole(String(profile?.role || "member"));
}

export async function isAdmin() {
  return (await getUserRole()) === "admin";
}

export async function isManagerOrAdmin() {
  const role = await getUserRole();
  return role === "admin" || role === "manager";
}

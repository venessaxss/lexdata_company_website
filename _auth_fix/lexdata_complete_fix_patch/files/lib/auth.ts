import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppRole, hasRoleAccess, normalizeRole } from "@/lib/roles";

export type { AppRole } from "@/lib/roles";

export type AuthContext = {
  id: string;
  email?: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  user: any;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: AppRole;
  };
  admin: ReturnType<typeof createAdminClient>;
};

export type CurrentProfile = AuthContext["profile"];

function safeLoginRedirect(next = "/dashboard") {
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  redirect(`/login?next=${encodeURIComponent(safeNext)}`);
}

function adminOverrideEmails() {
  return String(process.env.LEXDATA_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function applyAdminOverride(email?: string | null, role?: string | null): AppRole {
  if (email && adminOverrideEmails().includes(email.toLowerCase())) {
    return "admin";
  }

  return normalizeRole(role);
}

function makeContext(user: any, profileRow: any, admin: ReturnType<typeof createAdminClient>): AuthContext {
  const role = applyAdminOverride(user?.email, profileRow?.role);
  const profile = {
    id: user.id,
    full_name: profileRow?.full_name ?? user.email ?? null,
    avatar_url: profileRow?.avatar_url ?? null,
    role,
  };

  return {
    id: user.id,
    email: user.email,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role,
    user,
    profile,
    admin,
  };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const context = await getCurrentAuthContext();
  return context?.profile ?? null;
}

export async function getCurrentAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return null;

  const admin = createAdminClient();
  const { data: profileRow } = await admin
    .from("profiles")
    .select("id,full_name,avatar_url,role")
    .eq("id", userData.user.id)
    .maybeSingle();

  return makeContext(userData.user, profileRow, admin);
}

export async function requireUser(next = "/dashboard") {
  const user = await getCurrentUser();

  if (!user) {
    safeLoginRedirect(next);
  }

  return user;
}

export async function requireProfile(next = "/dashboard") {
  const context = await getCurrentAuthContext();

  if (!context) {
    safeLoginRedirect(next);
  }

  return context;
}

export async function requireRole(allowedRoles: AppRole[], next = "/dashboard") {
  const context = await requireProfile(next);

  if (!hasRoleAccess(context.role, allowedRoles)) {
    redirect(`/unauthorized?required=${encodeURIComponent(allowedRoles.join(", "))}`);
  }

  return context;
}

export async function requireAdmin(next = "/admin") {
  return requireRole(["admin"], next);
}

export async function requireSpeakerOrAdmin(next = "/speaker") {
  return requireRole(["speaker"], next);
}

export async function requireManagerOrAdmin(next = "/manager") {
  return requireRole(["manager"], next);
}

export async function requireAdminOrManager(next = "/admin") {
  return requireRole(["manager"], next);
}

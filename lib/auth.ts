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
  display_name?: string | null;

  user: any;
  profile: any;
  admin: ReturnType<typeof createAdminClient>;
};

export function normalizeRole(role?: string | null) {
  return String(role || "member").trim().toLowerCase();
}

function getAdminEmails() {
  return String(process.env.LEXDATA_ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function applyAdminOverride(email?: string | null, role?: string | null) {
  const normalized = normalizeRole(role);

  if (email && getAdminEmails().includes(email.toLowerCase())) {
    return "admin";
  }

  return normalized;
}

function makeContext(
  user: any,
  profile: any,
  admin: ReturnType<typeof createAdminClient>
): AuthContext {
  const role = applyAdminOverride(user?.email, profile?.role);

  const context = {
    ...(profile || {}),
    id: user.id,
    email: user.email,
    role,
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

  if (!user) {
    return null;
  }

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

export async function requireRole(allowedRoles: string[], next = "/dashboard") {
  const context = await requireProfile(next);
  const role = normalizeRole(context.role);
  const allowed = allowedRoles.map((item) => normalizeRole(item));

  if (role === "admin") {
    return context;
  }

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
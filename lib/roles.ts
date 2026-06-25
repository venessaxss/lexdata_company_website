export const APP_ROLES = ["student", "speaker", "manager", "admin"] as const;

export type AppRole = (typeof APP_ROLES)[number] | "instructor";

export const ROLE_LABELS: Record<AppRole, string> = {
  student: "Student",
  speaker: "Speaker",
  instructor: "Speaker",
  manager: "Manager",
  admin: "Admin"
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  student: "Learns courses, registers for workshops, and manages own payments.",
  speaker: "Delivers training sessions and checks own attendees.",
  instructor: "Delivers training sessions and checks own attendees.",
  manager: "Manages payments, registrations, and finance records.",
  admin: "Controls courses, workshops, users, roles, and all management pages."
};

export function normalizeRole(role?: string | null): AppRole {
  if (role === "admin" || role === "manager" || role === "speaker" || role === "instructor") {
    return role;
  }
  return "student";
}

export function isSpeakerRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized === "speaker" || normalized === "instructor" || normalized === "admin";
}

export function isManagerRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized === "manager" || normalized === "admin";
}

export function isAdminRole(role?: string | null) {
  return normalizeRole(role) === "admin";
}

export function hasRoleAccess(role: string | null | undefined, allowedRoles: AppRole[]) {
  const normalized = normalizeRole(role);

  // Admin can access every internal role area.
  if (normalized === "admin") return true;

  // Backward compatibility: old "instructor" role behaves like "speaker".
  if (normalized === "instructor" && allowedRoles.includes("speaker")) return true;

  return allowedRoles.includes(normalized);
}

export function defaultRoleHome(role?: string | null) {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "/admin/courses";
  if (normalized === "manager") return "/manager/payments";
  if (normalized === "speaker" || normalized === "instructor") return "/speaker/sessions";
  return "/dashboard";
}

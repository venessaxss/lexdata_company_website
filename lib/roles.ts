export const APP_ROLES = [
  "member",
  "speaker",
  "manager",
  "staff",
  "admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

type LegacyRole = "student";

export const ROLE_LABELS: Record<AppRole, string> = {
  member: "Member",
  speaker: "Speaker",
  manager: "Manager",
  staff: "Staff",
  admin: "Admin",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  member:
    "Registered website member. Can register for workshops, access approved learning materials, and receive messages.",
  speaker:
    "Workshop speaker. Can access assigned sessions and receive speaker-related messages.",
  manager:
    "Operations manager. Can manage registrations, manual payments, access confirmation, and messages.",
  staff:
    "Internal company, board, or team member. Can receive internal messages and access member tools.",
  admin:
    "Full website administrator. Can manage users, roles, workshops, media, registrations, and website content.",
};

export function normalizeRole(role?: string | null): AppRole {
  if (!role) {
    return "member";
  }

  // Backward compatibility for old database values.
  if (role === "student") {
    return "member";
  }

  if (APP_ROLES.includes(role as AppRole)) {
    return role as AppRole;
  }

  return "member";
}

export function getRoleLabel(role?: string | null) {
  return ROLE_LABELS[normalizeRole(role)];
}

export function getRoleDescription(role?: string | null) {
  return ROLE_DESCRIPTIONS[normalizeRole(role)];
}

export function hasRoleAccess(
  role?: string | null,
  allowedRoles: readonly (AppRole | LegacyRole | string)[] = []
) {
  const normalizedRole = normalizeRole(role);

  const normalizedAllowedRoles = allowedRoles.map((allowedRole) =>
    normalizeRole(allowedRole)
  );

  if (normalizedAllowedRoles.includes(normalizedRole)) {
    return true;
  }

  // Admin can access admin/manager/staff/member/speaker protected areas unless a page adds stricter custom logic.
  if (normalizedRole === "admin") {
    return true;
  }

  return false;
}

export function isAdminRole(role?: string | null) {
  return normalizeRole(role) === "admin";
}

export function isManagerRole(role?: string | null) {
  const normalizedRole = normalizeRole(role);

  return normalizedRole === "manager" || normalizedRole === "admin";
}

export function isSpeakerRole(role?: string | null) {
  return normalizeRole(role) === "speaker";
}

export function isStaffRole(role?: string | null) {
  return normalizeRole(role) === "staff";
}

export function isMemberRole(role?: string | null) {
  return normalizeRole(role) === "member";
}

export function canSendMessages(role?: string | null) {
  const normalizedRole = normalizeRole(role);

  return (
    normalizedRole === "admin" ||
    normalizedRole === "manager" ||
    normalizedRole === "speaker"
  );
}

export function canManagePayments(role?: string | null) {
  const normalizedRole = normalizeRole(role);

  return normalizedRole === "admin" || normalizedRole === "manager";
}

export function canManageWebsite(role?: string | null) {
  return normalizeRole(role) === "admin";
}
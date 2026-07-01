export const APP_ROLES = [
  "member",
  "speaker",
  "manager",
  "staff",
  "admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

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
import { getCurrentProfile, normalizeRole } from "@/lib/auth";
import LexNavClient from "@/components/LexNavClient";

function getDisplayName(profile: any) {
  const raw =
    profile?.full_name ||
    profile?.name ||
    profile?.display_name ||
    profile?.email ||
    "Member";

  return String(raw).trim();
}

export default async function LexPaperNavbar() {
  const profile = await getCurrentProfile();
  const isLoggedIn = Boolean(profile);
  const role = normalizeRole(profile?.role);
  const displayName = getDisplayName(profile);

  const canManage = role === "admin" || role === "manager";
  const isAdmin = role === "admin";

  return (
    <LexNavClient
      isLoggedIn={isLoggedIn}
      displayName={displayName}
      canManage={canManage}
      isAdmin={isAdmin}
    />
  );
}
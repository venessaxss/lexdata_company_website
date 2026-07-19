import Link from "next/link";
import { getCurrentProfile, normalizeRole } from "@/lib/auth";

function getDisplayName(profile: any) {
  const raw =
    profile?.full_name ||
    profile?.name ||
    profile?.display_name ||
    profile?.email ||
    "Member";

  return String(raw).trim();
}

export default async function HomeGreetingBadge() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return null;
  }

  const displayName = getDisplayName(profile);
  const role = normalizeRole(profile.role);
  const canManage = role === "admin" || role === "manager";

  return (
    <div className="lex-home-user-board">
      <p>Welcome back</p>
      <h2>{displayName}</h2>
      <span>Your LexData workspace is ready.</span>

      <div className="lex-home-user-actions">
        <Link href="/dashboard">Open dashboard</Link>
        {canManage ? <Link href="/manager">Manager panel</Link> : null}
        {role === "admin" ? <Link href="/admin">Admin panel</Link> : null}
      </div>
    </div>
  );
}
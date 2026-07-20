import Link from "next/link";
import Image from "next/image";
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

export default async function LexPaperNavbar() {
  const profile = await getCurrentProfile();
  const isLoggedIn = Boolean(profile);
  const role = normalizeRole(profile?.role);
  const displayName = getDisplayName(profile);

  const canManage = role === "admin" || role === "manager";
  const isAdmin = role === "admin";

  return (
    <header className="site">
      <div className="wrap">
        <Link prefetch={false} className="logo" href="/" aria-label="LexData home">
          <Image
            src="/lexdata-logo.png"
            alt="LexData"
            width={170}
            height={54}
            priority
          />
        </Link>

        <nav className="main" aria-label="Main navigation">
          <div className="paper-nav-item">
            <button type="button">Features v</button>
            <div className="paper-nav-menu">
              <Link prefetch={false} href="/courses">Courses</Link>
              <Link prefetch={false} href="/workshops">Workshops</Link>
              <Link prefetch={false} href="/blog/whats-new">What&apos;s new</Link>
              <Link prefetch={false} href="/about/ai-stance">AI stance</Link>
            </div>
          </div>

          <div className="paper-nav-item">
            <button type="button">Library v</button>
            <div className="paper-nav-menu">
              <Link prefetch={false} href="/courses">Course library</Link>
              <Link prefetch={false} href="/workshops">Workshop library</Link>
              <Link prefetch={false} href="/my/courses">My courses</Link>
              <Link prefetch={false} href="/my/workshops">My workshops</Link>
            </div>
          </div>

          <div className="paper-nav-item">
            <button type="button">About v</button>
            <div className="paper-nav-menu">
              <Link prefetch={false} href="/about">About</Link>
              <Link prefetch={false} href="/team">Team</Link>
              <Link prefetch={false} href="/collaboration">Collaboration</Link>
            </div>
          </div>

          <Link prefetch={false} href="/plus" className="paper-nav-plain">
            Plus+
          </Link>

          {isLoggedIn ? (
            <>
              <div className="paper-profile-control">
                <button type="button" className="paper-profile-button">
                  <span className="paper-profile-dot">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <span>{displayName}</span>
                </button>

                <div className="paper-profile-menu">
                  <Link prefetch={false} href="/dashboard/profile">Profile settings</Link>
                  <Link prefetch={false} href="/my/courses">My courses</Link>
                  <Link prefetch={false} href="/my/workshops">My workshops</Link>
                  {canManage ? <Link prefetch={false} href="/manager">Manager panel</Link> : null}
                  {isAdmin ? <Link prefetch={false} href="/admin">Admin panel</Link> : null}
                </div>
              </div>

              <Link prefetch={false} className="btn ghost small" href="/dashboard">
                Dashboard
              </Link>

              <Link prefetch={false} className="btn small" href="/logout">
                Log out
              </Link>
            </>
          ) : (
            <>
              <Link prefetch={false} className="btn ghost small" href="/login">
                Log in
              </Link>

              <Link prefetch={false} className="btn small" href="/signup">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
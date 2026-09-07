"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type MobileSection = "features" | "library" | "about" | null;

type LexNavClientProps = {
  isLoggedIn: boolean;
  displayName: string;
  canManage: boolean;
  isAdmin: boolean;
};

export default function LexNavClient({
  isLoggedIn,
  displayName,
  canManage,
  isAdmin,
}: LexNavClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MobileSection>(null);

  const closeAll = () => {
    setMobileOpen(false);
    setMobileSection(null);
  };

  const toggleSection = (name: Exclude<MobileSection, null>) => {
    setMobileSection((current) => (current === name ? null : name));
  };

  return (
    <>
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

          <button
            type="button"
            className="lx-nav-hamburger"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <span className="lx-hamburger-icon">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      <div
        className={`lx-mobile-backdrop ${mobileOpen ? "is-open" : ""}`}
        onClick={closeAll}
        aria-hidden="true"
      />

      <aside className={`lx-mobile-drawer ${mobileOpen ? "is-open" : ""}`} aria-label="Mobile navigation">
        <div className="lx-mobile-drawer-head">
          <Link href="/" className="lx-logo" onClick={closeAll}>
            <Image src="/lexdata-logo.png" alt="LexData" width={140} height={44} />
          </Link>

          <button
            type="button"
            className="lx-mobile-close"
            aria-label="Close menu"
            onClick={closeAll}
          >
            &times;
          </button>
        </div>

        <nav className="lx-mobile-drawer-links">
          <div className="lx-mobile-accordion">
            <button
              type="button"
              className={`lx-mobile-accordion-trigger ${mobileSection === "features" ? "is-open" : ""}`}
              onClick={() => toggleSection("features")}
              aria-expanded={mobileSection === "features"}
            >
              Features <span>{mobileSection === "features" ? "^" : "v"}</span>
            </button>

            {mobileSection === "features" ? (
              <div className="lx-mobile-accordion-panel">
                <Link href="/courses" onClick={closeAll}>Courses</Link>
                <Link href="/workshops" onClick={closeAll}>Workshops</Link>
                <Link href="/blog/whats-new" onClick={closeAll}>What&apos;s new</Link>
                <Link href="/about/ai-stance" onClick={closeAll}>AI stance</Link>
              </div>
            ) : null}
          </div>

          <div className="lx-mobile-accordion">
            <button
              type="button"
              className={`lx-mobile-accordion-trigger ${mobileSection === "library" ? "is-open" : ""}`}
              onClick={() => toggleSection("library")}
              aria-expanded={mobileSection === "library"}
            >
              Library <span>{mobileSection === "library" ? "^" : "v"}</span>
            </button>

            {mobileSection === "library" ? (
              <div className="lx-mobile-accordion-panel">
                <Link href="/courses" onClick={closeAll}>Course library</Link>
                <Link href="/workshops" onClick={closeAll}>Workshop library</Link>
                <Link href="/my/courses" onClick={closeAll}>My courses</Link>
                <Link href="/my/workshops" onClick={closeAll}>My workshops</Link>
              </div>
            ) : null}
          </div>

          <div className="lx-mobile-accordion">
            <button
              type="button"
              className={`lx-mobile-accordion-trigger ${mobileSection === "about" ? "is-open" : ""}`}
              onClick={() => toggleSection("about")}
              aria-expanded={mobileSection === "about"}
            >
              About <span>{mobileSection === "about" ? "^" : "v"}</span>
            </button>

            {mobileSection === "about" ? (
              <div className="lx-mobile-accordion-panel">
                <Link href="/about" onClick={closeAll}>About</Link>
                <Link href="/team" onClick={closeAll}>Team</Link>
                <Link href="/collaboration" onClick={closeAll}>Collaboration</Link>
              </div>
            ) : null}
          </div>

          <Link href="/plus" className="lx-mobile-plain-link" onClick={closeAll}>
            Plus+
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/dashboard/profile" className="lx-mobile-plain-link" onClick={closeAll}>
                Profile settings
              </Link>
              <Link href="/my/courses" className="lx-mobile-plain-link" onClick={closeAll}>
                My courses
              </Link>
              <Link href="/my/workshops" className="lx-mobile-plain-link" onClick={closeAll}>
                My workshops
              </Link>
              {canManage ? (
                <Link href="/manager" className="lx-mobile-plain-link" onClick={closeAll}>
                  Manager panel
                </Link>
              ) : null}
              {isAdmin ? (
                <Link href="/admin" className="lx-mobile-plain-link" onClick={closeAll}>
                  Admin panel
                </Link>
              ) : null}
            </>
          ) : null}
        </nav>

        <div className="lx-mobile-drawer-actions">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="lx-login-btn" onClick={closeAll}>
                Dashboard
              </Link>
              <Link href="/logout" className="lx-signup-btn" onClick={closeAll}>
                Log out
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="lx-login-btn" onClick={closeAll}>
                Log in
              </Link>
              <Link href="/signup" className="lx-signup-btn" onClick={closeAll}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
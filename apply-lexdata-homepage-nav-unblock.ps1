$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$parent = Split-Path $root -Parent
$backupRoot = Join-Path $parent ("lexdata_home_nav_unblock_backup_" + $stamp)

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

function Backup-File([string]$RelativePath) {
    $src = Join-Path $root $RelativePath
    if (Test-Path $src) {
        $dst = Join-Path $backupRoot $RelativePath
        $dir = Split-Path $dst -Parent
        if ($dir) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        Copy-Item $src $dst -Force
    }
}

function Write-Utf8([string]$Path, [string]$Content) {
    $dir = Split-Path $Path -Parent
    if ($dir -and !(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

if (!(Test-Path (Join-Path $root "package.json"))) {
    throw "Run this script from the LexData Next.js project root."
}

Write-Host "LexData homepage navbar/dashboard unblock patch" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

Backup-File "components\EllipsusNav.tsx"
Backup-File "components\IntegratedHomePage.tsx"
Backup-File "app\globals.css"

# -------------------------------------------------------------------
# 1. Rewrite EllipsusNav:
#    - do not auto-open a menu merely because the button receives focus
#    - close on outside click, Escape, route change, or scroll
#    - retain hover tolerance for moving into the submenu
#    - sync login state from the browser session after hydration
# -------------------------------------------------------------------

$navTsx = @'
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MenuName = "features" | "library" | "about" | null;

type EllipsusNavProps = {
  isLoggedIn?: boolean;
  dashboardHref?: string;
};

export default function EllipsusNav({
  isLoggedIn = false,
  dashboardHref = "/dashboard",
}: EllipsusNavProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | null>(null);

  const [open, setOpen] = useState<MenuName>(null);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const closeMenus = () => {
    clearCloseTimer();
    setOpen(null);
  };

  const showMenu = (name: Exclude<MenuName, null>) => {
    clearCloseTimer();
    setOpen(name);
  };

  const scheduleClose = (name: Exclude<MenuName, null>) => {
    clearCloseTimer();

    closeTimer.current = window.setTimeout(() => {
      setOpen((current) => (current === name ? null : current));
    }, 280);
  };

  useEffect(() => {
    setLoggedIn(isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setLoggedIn(Boolean(data.session));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setLoggedIn(Boolean(session));
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    closeMenus();
    return clearCloseTimer;
  }, [pathname]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!open) return;

      const target = event.target as Node | null;

      if (target && navRef.current && !navRef.current.contains(target)) {
        closeMenus();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenus();
      }
    };

    const handleScroll = () => {
      if (open) {
        closeMenus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [open]);

  const isCurrent = (name: Exclude<MenuName, null>) => {
    if (name === "about") return pathname.startsWith("/about");
    if (name === "library") {
      return pathname.startsWith("/workshops") || pathname.startsWith("/courses");
    }

    return false;
  };

  const menuButtonClass = (name: Exclude<MenuName, null>) =>
    `lx-nav-link lx-nav-button lx-has-menu ${
      open === name ? "is-open" : ""
    } ${isCurrent(name) ? "is-current" : ""}`;

  return (
    <header ref={navRef} className="lx-site-nav">
      <div className="lx-nav-inner">
        <Link href="/" className="lx-logo" aria-label="LexData home" onClick={closeMenus}>
          lexdata
        </Link>

        <nav className="lx-nav-links" aria-label="Primary navigation">
          <div
            className="lx-nav-menu"
            data-menu="features"
            onMouseEnter={() => showMenu("features")}
            onMouseLeave={() => scheduleClose("features")}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                scheduleClose("features");
              }
            }}
          >
            <button
              type="button"
              className={menuButtonClass("features")}
              onClick={() => setOpen(open === "features" ? null : "features")}
              aria-expanded={open === "features"}
            >
              Features <span>{open === "features" ? "^" : "v"}</span>
            </button>

            {open === "features" ? (
              <div
                className="lx-mega lx-mega-features"
                onMouseEnter={clearCloseTimer}
                onMouseLeave={() => scheduleClose("features")}
              >
                <div className="lx-mega-list">
                  <Link href="/#features" onClick={closeMenus}>
                    <b>F</b>
                    <span>Features</span>
                  </Link>
                  <Link href="/workshops" onClick={closeMenus}>
                    <b>*</b>
                    <span>What's new</span>
                  </Link>
                </div>
                <div className="lx-mega-art lx-mega-art-red" aria-hidden="true" />
              </div>
            ) : null}
          </div>

          <div
            className="lx-nav-menu"
            data-menu="library"
            onMouseEnter={() => showMenu("library")}
            onMouseLeave={() => scheduleClose("library")}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                scheduleClose("library");
              }
            }}
          >
            <button
              type="button"
              className={menuButtonClass("library")}
              onClick={() => setOpen(open === "library" ? null : "library")}
              aria-expanded={open === "library"}
            >
              Library <span>{open === "library" ? "^" : "v"}</span>
            </button>

            {open === "library" ? (
              <div
                className="lx-mega lx-mega-library"
                onMouseEnter={clearCloseTimer}
                onMouseLeave={() => scheduleClose("library")}
              >
                <div className="lx-mega-list">
                  <Link href="/workshops" onClick={closeMenus}>
                    <b>W</b>
                    <span>Workshops</span>
                  </Link>
                  <Link href="/#cases" onClick={closeMenus}>
                    <b>C</b>
                    <span>Research cases</span>
                  </Link>
                  <Link href="/#notifications" onClick={closeMenus}>
                    <b>N</b>
                    <span>Notifications</span>
                  </Link>
                </div>
                <div className="lx-mega-sketch lx-sketch-desk" aria-hidden="true">
                  <span className="lx-sketch-page" />
                  <span className="lx-sketch-cup">P</span>
                  <span className="lx-sketch-crumple">o</span>
                </div>
              </div>
            ) : null}
          </div>

          <div
            className="lx-nav-menu"
            data-menu="about"
            onMouseEnter={() => showMenu("about")}
            onMouseLeave={() => scheduleClose("about")}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                scheduleClose("about");
              }
            }}
          >
            <button
              type="button"
              className={menuButtonClass("about")}
              onClick={() => setOpen(open === "about" ? null : "about")}
              aria-expanded={open === "about"}
            >
              About <span>{open === "about" ? "^" : "v"}</span>
            </button>

            {open === "about" ? (
              <div
                className="lx-mega lx-mega-about"
                onMouseEnter={clearCloseTimer}
                onMouseLeave={() => scheduleClose("about")}
              >
                <div className="lx-mega-list">
                  <Link href="/about" onClick={closeMenus}>
                    <b>O</b>
                    <span>Who we are</span>
                  </Link>
                  <Link href="/about#story" onClick={closeMenus}>
                    <b>S</b>
                    <span>Our story</span>
                  </Link>
                  <Link href="/about#team" onClick={closeMenus}>
                    <b>T</b>
                    <span>Meet the team</span>
                  </Link>
                </div>
                <div className="lx-mega-sketch lx-sketch-portrait" aria-hidden="true">
                  <span>(o_o)</span>
                </div>
              </div>
            ) : null}
          </div>

          <Link
            href={loggedIn ? dashboardHref : "/signup"}
            className="lx-nav-link"
            onClick={closeMenus}
          >
            Plus+
          </Link>
        </nav>

        <div className="lx-nav-actions">
          <Link
            href={loggedIn ? dashboardHref : "/login"}
            className="lx-login-btn"
            onClick={closeMenus}
          >
            {loggedIn ? "Dashboard" : "Log in"}
          </Link>

          {!loggedIn ? (
            <Link href="/signup" className="lx-signup-btn" onClick={closeMenus}>
              Sign up
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
'@

Write-Utf8 (Join-Path $root "components\EllipsusNav.tsx") $navTsx

# -------------------------------------------------------------------
# 2. Pass the actual role-aware dashboard URL to the homepage navbar
#    and remove the stale third slider label.
# -------------------------------------------------------------------

$homePath = Join-Path $root "components\IntegratedHomePage.tsx"
$homePageContent = [System.IO.File]::ReadAllText($homePath)

$homePageContent = $homePageContent.Replace(
    '<EllipsusNav isLoggedIn={isLoggedIn} />',
    '<EllipsusNav isLoggedIn={isLoggedIn} dashboardHref={dashboardHref} />'
)

$homePageContent = $homePageContent.Replace(
    'labels={["Workspace", "Notifications", "Video"]}',
    'labels={["Workspace", "Notifications"]}'
)

Write-Utf8 $homePath $homePageContent

# -------------------------------------------------------------------
# 3. Fix the real visual collision:
#
# RootLayout renders LexPaperNavbar on every page, while the homepage
# ALSO renders EllipsusNav. Hide the global paper navbar only when the
# direct page child is the Ellipsus homepage. Other panels keep it.
# -------------------------------------------------------------------

$globalsPath = Join-Path $root "app\globals.css"
$globals = [System.IO.File]::ReadAllText($globalsPath)

$marker = "/* LEXDATA HOMEPAGE NAV COLLISION FIX */"

if (-not $globals.Contains($marker)) {
    $css = @'

/* LEXDATA HOMEPAGE NAV COLLISION FIX */

/*
  RootLayout renders header.site globally.
  IntegratedHomePage renders its own lx-site-nav.
  Showing both creates two navigation layers and lets the fixed mega-menu
  sit over the homepage dashboard/showcase area.

  Keep exactly one navbar on the homepage:
  - homepage: Ellipsus navbar
  - dashboard/manager/admin/other routes: global paper navbar
*/
body:has(> main.lx-page) > header.site {
  display: none !important;
}

/* The homepage already accounts for its own fixed Ellipsus navbar. */
body:has(> main.lx-page) > main.lx-page {
  margin-top: 0 !important;
}

/* Keep the menu above the page only while it is actually open. */
.lx-site-nav {
  z-index: 1000;
}

.lx-mega {
  z-index: 1001;
  pointer-events: auto;
}

/* Do not let decorative mega-menu artwork steal clicks. */
.lx-mega-art,
.lx-mega-sketch {
  pointer-events: none;
}
'@

    $globals = $globals + $css
    Write-Utf8 $globalsPath $globals
}

# Clear Next cache
Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Homepage navbar/dashboard unblock fix applied." -ForegroundColor Green
Write-Host ""
Write-Host "Fixed:" -ForegroundColor Cyan
Write-Host "  - Duplicate navbar collision on the homepage"
Write-Host "  - Mega menu staying open after focus/outside navigation"
Write-Host "  - Menu closes on outside click, Escape, route change, and scrolling"
Write-Host "  - Browser auth session updates Log in -> Dashboard after hydration"
Write-Host "  - Role-aware homepage Dashboard link"
Write-Host "  - Removed stale Video label from the two-slide dashboard board"
Write-Host ""
Write-Host "Run:" -ForegroundColor Cyan
Write-Host "  npm.cmd run build"
Write-Host ""
Write-Host "Then:" -ForegroundColor Cyan
Write-Host "  git add components/EllipsusNav.tsx components/IntegratedHomePage.tsx app/globals.css"
Write-Host '  git commit -m "Fix homepage navbar overlay and unblock dashboard showcase"'
Write-Host "  git push origin HEAD"

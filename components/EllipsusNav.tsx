"use client";

import Link from "next/link";
import Image from "next/image";
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
        <Link href="/" className="lx-logo" aria-label="LexData home" onClick={closeMenus}><Image src="/lexdata-logo.png" alt="LexData" width={170} height={54} priority /></Link>

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
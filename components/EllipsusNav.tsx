"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type MenuName = "features" | "library" | "about" | null;

export default function EllipsusNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<MenuName>(null);
  const closeTimer = useRef<number | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const showMenu = (name: Exclude<MenuName, null>) => {
    clearCloseTimer();
    setOpen(name);
  };

  const scheduleClose = (name: Exclude<MenuName, null>) => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setOpen((current) => (current === name ? null : current));
    }, 420);
  };

  const closeMenus = () => {
    clearCloseTimer();
    setOpen(null);
  };

  useEffect(() => {
    closeMenus();
    return clearCloseTimer;
  }, [pathname]);

  const isCurrent = (name: Exclude<MenuName, null>) => {
    if (name === "about") return pathname.startsWith("/about");
    if (name === "library") return pathname.startsWith("/workshops");
    return false;
  };

  const menuButtonClass = (name: Exclude<MenuName, null>) =>
    `lx-nav-link lx-nav-button lx-has-menu ${open === name ? "is-open" : ""} ${isCurrent(name) ? "is-current" : ""}`;

  return (
    <header className="lx-site-nav">
      <div className="lx-nav-inner">
        <Link href="/" className="lx-logo" aria-label="LexData home">
          lexdata
        </Link>

        <nav className="lx-nav-links" aria-label="Primary navigation">
          <div
            className="lx-nav-menu"
            data-menu="features"
            onMouseEnter={() => showMenu("features")}
            onMouseLeave={() => scheduleClose("features")}
          >
            <button
              type="button"
              className={menuButtonClass("features")}
              onClick={() => setOpen(open === "features" ? null : "features")}
              onFocus={() => showMenu("features")}
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
                  <Link href="/#features" onClick={closeMenus}><b>F</b><span>Features</span></Link>
                  <Link href="/workshops" onClick={closeMenus}><b>*</b><span>What's new</span></Link>
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
          >
            <button
              type="button"
              className={menuButtonClass("library")}
              onClick={() => setOpen(open === "library" ? null : "library")}
              onFocus={() => showMenu("library")}
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
                  <Link href="/workshops" onClick={closeMenus}><b>W</b><span>Workshops</span></Link>
                  <Link href="/#cases" onClick={closeMenus}><b>C</b><span>Research cases</span></Link>
                  <Link href="/#media" onClick={closeMenus}><b>V</b><span>Media library</span></Link>
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
          >
            <button
              type="button"
              className={menuButtonClass("about")}
              onClick={() => setOpen(open === "about" ? null : "about")}
              onFocus={() => showMenu("about")}
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
                  <Link href="/about" onClick={closeMenus}><b>O</b><span>Who we are</span></Link>
                  <Link href="/about#story" onClick={closeMenus}><b>S</b><span>Our story</span></Link>
                  <Link href="/about#team" onClick={closeMenus}><b>T</b><span>Meet the team</span></Link>
                </div>
                <div className="lx-mega-sketch lx-sketch-portrait" aria-hidden="true">
                  <span>(o_o)</span>
                </div>
              </div>
            ) : null}
          </div>

          <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="lx-nav-link">Plus+</Link>
        </nav>

        <div className="lx-nav-actions">
          <Link href={isLoggedIn ? "/dashboard" : "/login"} className="lx-login-btn">
            {isLoggedIn ? "Dashboard" : "Log in"}
          </Link>
          {!isLoggedIn ? <Link href="/signup" className="lx-signup-btn">Sign up</Link> : null}
        </div>
      </div>
    </header>
  );
}
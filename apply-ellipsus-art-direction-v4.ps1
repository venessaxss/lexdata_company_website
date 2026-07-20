$ErrorActionPreference = "Stop"

$root = Get-Location
if (!(Test-Path (Join-Path $root "package.json"))) {
  throw "Run this script from the Next.js project root (the folder containing package.json)."
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$parentRoot = Split-Path $root -Parent
$backupBase = Join-Path $parentRoot "lexdata_ellipsus_backups"
New-Item -ItemType Directory -Force $backupBase | Out-Null

# Move older in-project art backups out of the Next.js project so TypeScript will not scan them.
Get-ChildItem -Path $root -Directory -Filter "_ellipsus_art_backup_*" -ErrorAction SilentlyContinue | ForEach-Object {
  $target = Join-Path $backupBase $_.Name
  if (Test-Path $target) {
    $target = Join-Path $backupBase ($_.Name + "_" + $stamp)
  }
  Move-Item $_.FullName $target -Force
  Write-Host "Moved old backup outside project: $($_.Name)" -ForegroundColor DarkYellow
}

$backupRoot = Join-Path $backupBase ("ellipsus_v4_backup_" + $stamp)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Backup-File([string]$relative) {
  $src = Join-Path $root $relative
  if (Test-Path $src) {
    $dest = Join-Path $backupRoot $relative
    New-Item -ItemType Directory -Force (Split-Path -Parent $dest) | Out-Null
    Copy-Item $src $dest -Force
  }
}

function Write-ProjectFile([string]$relative, [string]$content) {
  Backup-File $relative
  $dest = Join-Path $root $relative
  New-Item -ItemType Directory -Force (Split-Path -Parent $dest) | Out-Null
  [System.IO.File]::WriteAllText($dest, $content, $utf8NoBom)
  Write-Host "Wrote $relative" -ForegroundColor Green
}

$navContent = @'
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
'@

$teamWallContent = @'
"use client";

import { useMemo, useState } from "react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio?: string | null;
  location?: string | null;
  initials: string;
  photo?: string | null;
};

export default function AboutTeamWall({ members }: { members: TeamMember[] }) {
  const safeMembers = useMemo(
    () => members.length > 0 ? members : [
      { id: "research", name: "Research", role: "Language science", location: "LexData", initials: "R", bio: "Research design, corpus work, and evidence-led inquiry.", photo: null },
      { id: "training", name: "Training", role: "Workshops and learning", location: "LexData", initials: "T", bio: "Hands-on learning experiences for researchers and professionals.", photo: null },
      { id: "technology", name: "Technology", role: "AI and data systems", location: "LexData", initials: "A", bio: "Practical tooling that keeps people in control of the workflow.", photo: null },
    ],
    [members]
  );

  const [active, setActive] = useState(0);
  const selected = safeMembers[Math.min(active, safeMembers.length - 1)];

  return (
    <div className="lx-team-board">
      <article className="lx-team-feature" aria-live="polite" key={selected.id}>
        <div className={`lx-team-portrait ${selected.photo ? "has-photo" : ""}`}>
          {selected.photo ? (
            <img src={selected.photo} alt={`${selected.name} portrait`} />
          ) : (
            <div className="lx-team-sketch-fallback" aria-hidden="true">
              <i className="lx-sketch-hair" />
              <i className="lx-sketch-face" />
              <i className="lx-sketch-glasses" />
              <strong>{selected.initials}</strong>
            </div>
          )}
        </div>
        <div className="lx-team-card-caption">
          <strong>{selected.name}</strong>
          <span>{selected.role}</span>
        </div>
      </article>

      <div className="lx-team-list" role="list">
        {safeMembers.map((member, index) => (
          <button
            type="button"
            key={member.id}
            className={`lx-team-row ${index === active ? "is-active" : ""}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
          >
            <span className="lx-team-name">{member.name}</span>
            <span className="lx-team-role">{member.role}</span>
            <span className="lx-team-place">{member.location || "LexData"} <b>o</b></span>
          </button>
        ))}
      </div>
    </div>
  );
}
'@

$videoConfigContent = @'
export type EditorialVideoItem = {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  poster?: string;
  src?: string;
  kind?: "file" | "youtube";
};

/*
HOW TO ADD A VIDEO

1. Put a local MP4 in public/videos and a poster image in public/video-posters.
2. Add another object to this array.

Local MP4 example:
{
  id: "workshop-01",
  eyebrow: "Workshop highlight",
  title: "Corpus research in motion",
  description: "A short introduction to the workshop.",
  poster: "/video-posters/workshop-01.jpg",
  src: "/videos/workshop-01.mp4",
  kind: "file",
}

YouTube example:
{
  id: "youtube-01",
  eyebrow: "Watch now",
  title: "LexData research session",
  poster: "/video-posters/youtube-01.jpg",
  src: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
  kind: "youtube",
}
*/
export const editorialVideos: EditorialVideoItem[] = [
  {
    id: "lexdata-intro",
    eyebrow: "Introducing LexData",
    title: "So... what's this all about?",
    description: "Add your first video URL in content/editorialVideos.ts. The card below will become a playable editorial video feature.",
    poster: "",
    src: "",
    kind: "file",
  },
];
'@

$videoShowcaseContent = @'
"use client";

import { useEffect, useMemo, useState } from "react";
import type { EditorialVideoItem } from "@/content/editorialVideos";

function youtubeEmbedUrl(src: string) {
  try {
    const url = new URL(src);
    if (url.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${url.pathname.replace("/", "")}`;
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return src;
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return src;
  }
  return src;
}

export default function EditorialVideoShowcase({ videos }: { videos: EditorialVideoItem[] }) {
  const visibleVideos = useMemo(() => videos.filter(Boolean), [videos]);
  const [activeId, setActiveId] = useState(visibleVideos[0]?.id || "");
  const [playing, setPlaying] = useState(false);

  const active = visibleVideos.find((video) => video.id === activeId) || visibleVideos[0];

  useEffect(() => {
    setPlaying(false);
  }, [activeId]);

  if (!active) return null;

  const canPlay = Boolean(active.src);
  const posterStyle = active.poster ? { backgroundImage: `url(${active.poster})` } : undefined;

  return (
    <div className="lx-editorial-video">
      <div className="lx-editorial-video-copy">
        <p>{active.eyebrow}</p>
        <h3>{active.title}</h3>
        {active.description ? <span>{active.description}</span> : null}
      </div>

      <div className={`lx-video-frame ${active.poster ? "has-poster" : "no-poster"}`} style={posterStyle}>
        {playing && canPlay ? (
          active.kind === "youtube" ? (
            <iframe
              src={`${youtubeEmbedUrl(active.src || "")}?autoplay=1&rel=0`}
              title={active.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={active.src} controls autoPlay playsInline />
          )
        ) : (
          <>
            <div className="lx-video-mock-ui" aria-hidden="true">
              <i /><i /><i /><i />
            </div>
            <button
              type="button"
              className="lx-video-play"
              onClick={() => canPlay && setPlaying(true)}
              aria-label={canPlay ? `Play ${active.title}` : "Add a video URL to enable playback"}
              title={canPlay ? `Play ${active.title}` : "Add src in content/editorialVideos.ts"}
            >
              <span />
            </button>
          </>
        )}
      </div>

      {visibleVideos.length > 1 ? (
        <div className="lx-video-picker" aria-label="Choose video">
          {visibleVideos.map((video) => (
            <button
              key={video.id}
              type="button"
              className={video.id === active.id ? "is-active" : ""}
              onClick={() => setActiveId(video.id)}
            >
              <small>{video.eyebrow}</small>
              <strong>{video.title}</strong>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
'@

$homePageContent = @'
import Link from "next/link";
import PaperTypewriterLine from "@/components/PaperTypewriterLine";
import EllipsusNav from "@/components/EllipsusNav";
import DynamicHomeShowcase from "@/components/DynamicHomeShowcase";
import NoticeSpotlight from "@/components/NoticeSpotlight";
import HomeMediaShowcase from "@/components/HomeMediaShowcase";
import HomeVideoSpotlight from "@/components/HomeVideoSpotlight";
import LatestWorkshopVideos from "@/components/LatestWorkshopVideos";
import TeamShowcase from "@/components/TeamShowcase";
import EditorialVideoShowcase from "@/components/EditorialVideoShowcase";
import { editorialVideos } from "@/content/editorialVideos";
import { getCurrentProfile, normalizeRole } from "@/lib/auth";

const typingPhrases = [
  "Research like a human.",
  "Translate with context.",
  "Build with data.",
  "Teach with evidence.",
];

const caseCards = [
  { label: "Case 01", title: "Corpus-based research training", body: "From raw text collection to cleaning, annotation, and analysis-ready datasets." },
  { label: "Case 02", title: "Multilingual translation workflow", body: "Human-in-the-loop terminology, translation review, and bilingual quality control." },
  { label: "Case 03", title: "AI research classroom", body: "Generative AI, Python, and NLP turned into practical workshops for humanities researchers." },
];

const floatingLetters = ["u", "n", "d", "k", "p", "d", "a", "z", "g", "m", "v", "e", "f", "w", "t", "c", "x", "y", "q", "s", "h", "r"];

function displayName(profile: any) {
  return profile?.full_name || profile?.name || profile?.display_name || profile?.email || "Member";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IntegratedHomePage() {
  const profile = await getCurrentProfile();
  const role = normalizeRole(profile?.role);
  const isLoggedIn = Boolean(profile);
  const canManage = role === "admin" || role === "manager";

  return (
    <main className="ell-page lx-page">
      <EllipsusNav isLoggedIn={isLoggedIn} />

      <div className="lx-cover-sequence">
        <section className="lx-hero-sticky" aria-label="LexData introduction">
          <div className="lx-floating-letters" aria-hidden="true">
            {floatingLetters.map((letter, index) => (
              <span key={`${letter}-${index}`} style={{ "--i": index } as React.CSSProperties}>{letter}</span>
            ))}
          </div>

          <svg className="lx-plane lx-plane-left" viewBox="0 0 140 120" aria-hidden="true">
            <path d="M12 66 124 18 78 106 58 72 12 66Z" />
            <path d="M58 72 124 18 70 62" />
          </svg>
          <svg className="lx-plane lx-plane-right" viewBox="0 0 140 120" aria-hidden="true">
            <path d="M20 20 124 64 78 70 58 112 48 72 20 20Z" />
            <path d="M48 72 124 64 58 58" />
          </svg>

          <div className="lx-hero-center">
            <h1><PaperTypewriterLine phrases={typingPhrases} /></h1>
            <p>LexData is a collaborative research and learning platform made for language, translation, AI, and data-driven creativity.</p>
            <div className="lx-hero-actions">
              <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="lx-join-btn">
                {isLoggedIn ? `Open ${displayName(profile)} dashboard` : "Join for free"}
              </Link>
              {canManage ? <Link href="/manager/registrations" className="lx-text-link">Review registrations</Link> : null}
            </div>
          </div>
        </section>

        <section className="lx-paper-cover" id="features">
          <div className="lx-wave-top" aria-hidden="true" />
          <div className="lx-paper-intro">
            <div className="lx-book-stack" aria-hidden="true"><span /><span /><span /></div>
            <h2>Made for <em>creative</em> researchers</h2>
          </div>

          <div className="lx-paper-copy">
            <p>
              Plenty of tools are made for memos, notes, and to-do lists.
              <strong className="lx-squiggle lx-squiggle-red"> That's not us.</strong>
            </p>
            <p>
              LexData is here to help you build research worlds, connect languages,
              raise better questions, and celebrate creativity in
              <strong className="lx-circle-green"> all its forms.</strong>
            </p>
          </div>

          <div className="lx-ai-stance">
            <div className="lx-robot" aria-hidden="true">
              <div className="lx-robot-head"><span>x</span><span>x</span></div>
              <div className="lx-robot-body">KEYS</div>
              <div className="lx-paper-bin">o o o</div>
            </div>
            <div className="lx-ai-copy">
              <p>
                We think researchers should be free to
                <span className="lx-underline-green"> express their creative vision</span> - away
                from opaque automation and the
                <span className="lx-circle-red"> prying eyes of AI.</span>
              </p>
              <small>Your content is <b>YOURS.</b> Human judgment stays in control.</small>
            </div>
          </div>
        </section>
      </div>

      <section className="lx-showcase-shell">
        <div className="lx-section-kicker">CONNECTED RESEARCH WORKFLOWS</div>
        <DynamicHomeShowcase />
      </section>

      <section className="lx-editorial-section" id="cases">
        <div className="lx-editorial-heading">
          <p>Selected work</p>
          <h2>Cases, methods, and research stories.</h2>
        </div>
        <div className="lx-case-grid">
          {caseCards.map((card) => (
            <article key={card.title} className="lx-case-card">
              <span>{card.label}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <NoticeSpotlight />

      <section className="lx-media-section" id="media">
        <EditorialVideoShowcase videos={editorialVideos} />
        <div className="lx-editorial-heading lx-media-secondary-heading">
          <p>Video and media</p>
          <h2>Watch the platform move.</h2>
        </div>
        <HomeMediaShowcase videos={[]} />
        <HomeVideoSpotlight />
        <LatestWorkshopVideos />
      </section>

      <TeamShowcase />

      <section className="lx-final-cta">
        <p>One login. One dashboard.</p>
        <h2>Complete the whole research flow without breaking your rhythm.</h2>
        <div>
          <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="lx-join-btn">{isLoggedIn ? "Open dashboard" : "Get started"}</Link>
          <Link href="/about" className="lx-final-link">Meet the people behind LexData</Link>
        </div>
      </section>
    </main>
  );
}
'@

$aboutPageContent = @'
import PaperTypewriterLine from "@/components/PaperTypewriterLine";
import EllipsusNav from "@/components/EllipsusNav";
import AboutTeamWall from "@/components/AboutTeamWall";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { site } from "@/lib/site";

type TeamMember = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  role?: string | null;
  role_title?: string | null;
  position_title?: string | null;
  bio?: string | null;
  initials?: string | null;
  section?: string | null;
  location?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
  avatar_url?: string | null;
  portrait_url?: string | null;
  sort_order?: number | null;
};

function nameOf(member: TeamMember) {
  return member.full_name || member.name || "LexData member";
}

function roleOf(member: TeamMember) {
  return member.position_title || member.role_title || member.role || "Team member";
}

function initialsOf(member: TeamMember) {
  const name = nameOf(member);
  if (member.initials) return member.initials;
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function photoOf(member: TeamMember) {
  return member.photo_url || member.image_url || member.avatar_url || member.portrait_url || null;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AboutPage() {
  const [supabase, profile] = await Promise.all([createClient(), getCurrentProfile()]);
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(9);

  const members = ((data ?? []) as TeamMember[]).map((member) => ({
    id: member.id,
    name: nameOf(member),
    role: roleOf(member),
    bio: member.bio || null,
    location: member.location || member.section || "LexData",
    initials: initialsOf(member),
    photo: photoOf(member),
  }));

  return (
    <main className="lx-about-page">
      <EllipsusNav isLoggedIn={Boolean(profile)} />

      <section className="lx-about-hero">
        <div className="lx-floating-letters lx-about-letters" aria-hidden="true">
          {Array.from("ourstorylexdata").map((letter, index) => (
            <span key={`${letter}-${index}`} style={{ "--i": index } as React.CSSProperties}>{letter}</span>
          ))}
        </div>
        <h1><PaperTypewriterLine phrases={["Our story, so far...", "People before platforms.", "Research with a human pulse."]} /></h1>
      </section>

      <section className="lx-about-story" id="story">
        <div className="lx-story-mark">01</div>
        <div>
          <p className="lx-story-kicker">Our story</p>
          <h2>{site.name} was built to make serious research feel more human.</h2>
          <p>
            We bring language science, translation, education, AI, and social data into one practical environment - without turning the researcher into a passenger.
          </p>
          <p>
            The platform connects workshops, cases, messages, media, and collaborative workflows so people can move from an idea to an evidence-based outcome while keeping context, judgment, and creativity intact.
          </p>
        </div>
        <div className="lx-story-doodle" aria-hidden="true">*<br />~<br />P</div>
      </section>

      <section className="lx-team-section" id="team">
        <div className="lx-team-title">
          <p>The humans behind the work</p>
          <h2>Meet the team</h2>
        </div>
        <AboutTeamWall members={members} />
      </section>
    </main>
  );
}
'@

$cssPatch = @'
/* === LEXDATA ELLIPSUS V4 START === */

/* Stable hover navigation and hand-drawn active circles */
.lx-site-nav { overflow: visible; }
.lx-nav-menu { position: relative; height: var(--lx-nav-h); display: flex; align-items: center; }
.lx-nav-menu::after {
  content: "";
  position: absolute;
  left: -22px;
  right: -22px;
  top: calc(100% - 8px);
  height: 28px;
  pointer-events: auto;
}
.lx-nav-link.lx-has-menu { position: relative; z-index: 2; padding-left: 4px; padding-right: 4px; }
.lx-nav-link.lx-has-menu::before {
  content: "";
  position: absolute;
  z-index: -1;
  left: -17px;
  right: -17px;
  top: 13px;
  bottom: 12px;
  border: 1.6px solid currentColor;
  border-radius: 50%;
  opacity: 0;
  transform: rotate(-3deg) scale(.9);
  transition: opacity .18s ease, transform .22s ease;
  pointer-events: none;
}
.lx-nav-link.lx-has-menu::after {
  content: "";
  position: absolute;
  z-index: -1;
  left: -12px;
  right: -21px;
  top: 16px;
  bottom: 10px;
  border-top: 1px solid currentColor;
  border-radius: 50%;
  opacity: 0;
  transform: rotate(2deg);
  pointer-events: none;
}
.lx-nav-link.lx-has-menu.is-open::before,
.lx-nav-link.lx-has-menu.is-current::before,
.lx-nav-link.lx-has-menu.is-open::after,
.lx-nav-link.lx-has-menu.is-current::after { opacity: 1; transform: rotate(-3deg) scale(1); }
.lx-nav-menu[data-menu="features"] .lx-nav-link.is-open,
.lx-nav-menu[data-menu="features"] .lx-nav-link.is-current { color: #ff4f43; }
.lx-nav-menu[data-menu="library"] .lx-nav-link.is-open,
.lx-nav-menu[data-menu="library"] .lx-nav-link.is-current { color: #c84df0; }
.lx-nav-menu[data-menu="about"] .lx-nav-link.is-open,
.lx-nav-menu[data-menu="about"] .lx-nav-link.is-current { color: #2684dc; }

.lx-mega {
  position: fixed;
  top: calc(var(--lx-nav-h) - 1px);
  left: 50%;
  width: min(900px, calc(100vw - 120px));
  min-height: 310px;
  transform: translateX(-50%);
  padding: 54px 64px;
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(0,0,0,.12);
  animation: lxMegaIn .18s ease-out both;
  overflow: hidden;
}
@keyframes lxMegaIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(.99); }
  to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}
.lx-mega-features { grid-template-columns: 1fr 1.1fr; }
.lx-mega-about { width: min(760px, calc(100vw - 120px)); }
.lx-mega-list { position: relative; z-index: 2; }
.lx-mega-list a { width: max-content; min-width: 240px; }
.lx-mega-list a span { position: relative; }
.lx-mega-list a:hover span::after {
  content: "";
  position: absolute;
  left: -5px;
  right: -16px;
  bottom: -8px;
  border-bottom: 2px solid currentColor;
  border-radius: 50%;
  transform: rotate(2deg);
}
.lx-mega-art { position: relative; min-height: 190px; }
.lx-mega-art-red::before,
.lx-mega-art-red::after {
  content: "";
  position: absolute;
  width: 390px;
  height: 160px;
  right: -145px;
  top: -80px;
  border: 4px solid #ff4f43;
  border-radius: 50%;
  transform: rotate(44deg);
}
.lx-mega-art-red::after { right: -95px; top: -115px; transform: rotate(53deg); border-width: 3px; }

/* Editorial video card that can use local MP4 files or YouTube links */
.lx-editorial-video {
  width: min(1120px, 100%);
  margin: 0 auto 130px;
  text-align: center;
}
.lx-editorial-video-copy { max-width: 850px; margin: 0 auto 48px; }
.lx-editorial-video-copy > p {
  margin: 0 0 18px;
  color: #ff4f43;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.lx-editorial-video-copy h3 {
  margin: 0;
  font: 500 clamp(48px, 5.4vw, 82px)/1 Fraunces, Georgia, serif;
  letter-spacing: -.055em;
}
.lx-editorial-video-copy span { display: block; margin-top: 22px; font-size: 19px; line-height: 1.5; color: #444; }
.lx-video-frame {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
  border: 12px solid #fff;
  border-radius: 24px;
  background-position: center;
  background-size: cover;
  box-shadow: 0 18px 50px rgba(0,0,0,.12);
}
.lx-video-frame.no-poster {
  background:
    radial-gradient(circle at 18% 24%, rgba(201,81,244,.42), transparent 22%),
    radial-gradient(circle at 76% 30%, rgba(255,191,62,.55), transparent 24%),
    radial-gradient(circle at 52% 74%, rgba(35,126,215,.55), transparent 30%),
    linear-gradient(135deg, #151425, #312038 52%, #12131d);
}
.lx-video-frame iframe,
.lx-video-frame video { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; object-fit: cover; background: #000; }
.lx-video-play {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 88px;
  height: 88px;
  transform: translate(-50%, -50%);
  border: 0;
  border-radius: 50%;
  background: #247fd0;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(0,0,0,.24);
}
.lx-video-play span {
  display: block;
  width: 0;
  height: 0;
  margin-left: 34px;
  border-top: 14px solid transparent;
  border-bottom: 14px solid transparent;
  border-left: 22px solid #fff;
}
.lx-video-mock-ui { position: absolute; inset: 9% 7%; pointer-events: none; }
.lx-video-mock-ui i {
  position: absolute;
  display: block;
  border-radius: 18px;
  background: rgba(255,255,255,.18);
  border: 1px solid rgba(255,255,255,.22);
  backdrop-filter: blur(6px);
}
.lx-video-mock-ui i:nth-child(1) { width: 38%; height: 50%; left: 8%; top: 10%; transform: rotate(4deg); }
.lx-video-mock-ui i:nth-child(2) { width: 30%; height: 28%; right: 7%; top: 3%; transform: rotate(5deg); }
.lx-video-mock-ui i:nth-child(3) { width: 34%; height: 32%; right: 10%; bottom: 4%; transform: rotate(-4deg); }
.lx-video-mock-ui i:nth-child(4) { width: 28%; height: 27%; left: 14%; bottom: 4%; transform: rotate(-8deg); }
.lx-video-picker { margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; text-align: left; }
.lx-video-picker button { padding: 18px; border: 1px solid rgba(0,0,0,.18); border-radius: 16px; background: #f7f7f3; cursor: pointer; }
.lx-video-picker button.is-active { border-color: #111; box-shadow: inset 0 0 0 1px #111; }
.lx-video-picker small, .lx-video-picker strong { display: block; }
.lx-video-picker small { margin-bottom: 6px; text-transform: uppercase; letter-spacing: .08em; color: #666; }
.lx-media-secondary-heading { margin-top: 120px; }

/* About team wall: floating portrait card over a dark editorial list */
.lx-team-section {
  position: relative;
  min-height: 1050px;
  padding-top: 90px;
}
.lx-team-title {
  position: relative;
  z-index: 4;
  width: min(1500px, 100%);
  min-height: 160px;
  margin: 0 auto;
  padding-right: 3%;
  text-align: right;
}
.lx-team-title p { opacity: .6; }
.lx-team-title h2 { font-size: clamp(74px, 8vw, 138px); }
.lx-team-board { min-height: 760px; margin-top: -20px; }
.lx-team-list { position: relative; z-index: 2; padding-top: 65px; }
.lx-team-row {
  min-height: 102px;
  grid-template-columns: 1fr 1.15fr .9fr;
  padding: 0 10px;
  transition: color .18s ease, transform .2s ease, opacity .18s ease;
}
.lx-team-row:not(.is-active) { opacity: .62; }
.lx-team-row:hover { opacity: .9; }
.lx-team-row.is-active { opacity: 1; transform: none; }
.lx-team-name { font-size: clamp(24px, 2vw, 31px); }
.lx-team-row.is-active .lx-team-name::after {
  left: -34px;
  top: 50%;
  width: 190px;
  height: 58px;
  border: 2px solid #ff9b23;
  transform: translateY(-50%) rotate(2deg);
  box-shadow: 10px 3px 0 -8px #ff9b23;
}
.lx-team-feature {
  z-index: 3;
  left: 31%;
  top: -155px;
  width: min(455px, 31vw);
  min-height: 560px;
  border-radius: 20px;
  transform: rotate(8deg);
  background: #f4f4ef;
  animation: lxTeamCardIn .28s ease-out both;
}
@keyframes lxTeamCardIn {
  from { opacity: 0; transform: rotate(5deg) translateY(-10px) scale(.98); }
  to { opacity: 1; transform: rotate(8deg) translateY(0) scale(1); }
}
.lx-team-portrait { position: relative; min-height: 485px; overflow: hidden; background: #f5f5f0; }
.lx-team-portrait.has-photo img { width: 100%; height: 485px; object-fit: cover; filter: grayscale(1) contrast(1.05); }
.lx-team-sketch-fallback { position: absolute; inset: 0; display: grid; place-items: center; background: repeating-linear-gradient(0deg, transparent 0 24px, rgba(0,0,0,.035) 24px 25px), #f6f6f2; }
.lx-team-sketch-fallback strong { position: relative; z-index: 4; font: 500 110px/1 Fraunces, Georgia, serif; color: #222; opacity: .9; }
.lx-team-sketch-fallback i { position: absolute; display: block; border: 3px solid #202020; }
.lx-sketch-face { width: 205px; height: 235px; border-radius: 46% 48% 45% 50%; top: 110px; left: 50%; transform: translateX(-50%) rotate(-3deg); }
.lx-sketch-hair { width: 210px; height: 110px; border-width: 4px 4px 0 0 !important; border-radius: 70% 60% 0 0; top: 74px; left: 50%; transform: translateX(-50%) rotate(-7deg); }
.lx-sketch-glasses { width: 175px; height: 58px; border-radius: 28px; top: 170px; left: 50%; transform: translateX(-50%) rotate(2deg); box-shadow: inset 82px 0 0 -79px #222; }
.lx-team-card-caption { min-height: 78px; padding: 16px 22px; display: flex; align-items: baseline; justify-content: space-between; gap: 20px; background: #f4f4ef; color: #111; }
.lx-team-card-caption strong { font: 500 30px/1 Fraunces, Georgia, serif; }
.lx-team-card-caption span { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #666; }

@media (max-width: 980px) {
  .lx-mega { top: var(--lx-nav-h); left: 12px; right: 12px; width: auto; transform: none; }
  @keyframes lxMegaIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .lx-team-section { min-height: auto; }
  .lx-team-title { text-align: center; padding-right: 0; }
  .lx-team-board { margin-top: 0; }
  .lx-team-feature { position: relative; left: auto; top: auto; width: min(455px, 90vw); margin: 0 auto 54px; }
  .lx-team-portrait, .lx-team-portrait.has-photo img { min-height: 430px; height: 430px; }
  .lx-team-list { padding-top: 0; }
  .lx-video-frame { border-width: 8px; border-radius: 18px; }
}

@media (max-width: 640px) {
  .lx-nav-menu[data-menu="features"] { display: none; }
  .lx-mega { padding: 28px 24px; min-height: 230px; }
  .lx-mega-list a { min-width: 0; width: 100%; }
  .lx-video-play { width: 68px; height: 68px; }
  .lx-video-play span { margin-left: 27px; border-top-width: 11px; border-bottom-width: 11px; border-left-width: 18px; }
  .lx-editorial-video { margin-bottom: 80px; }
  .lx-team-row { grid-template-columns: 1fr; padding: 18px 0; }
  .lx-team-place { display: none; }
  .lx-team-feature { transform: rotate(3deg); }
}

/* === LEXDATA ELLIPSUS V4 END === */
'@

Write-ProjectFile "components\EllipsusNav.tsx" $navContent
Write-ProjectFile "components\AboutTeamWall.tsx" $teamWallContent
Write-ProjectFile "components\EditorialVideoShowcase.tsx" $videoShowcaseContent
Write-ProjectFile "content\editorialVideos.ts" $videoConfigContent
Write-ProjectFile "components\IntegratedHomePage.tsx" $homePageContent
Write-ProjectFile "app\about\page.tsx" $aboutPageContent

$cssPath = Join-Path $root "app\ellipsus-home.css"
if (!(Test-Path $cssPath)) {
  throw "app\ellipsus-home.css was not found. Apply the previous Ellipsus art-direction patch first."
}

Backup-File "app\ellipsus-home.css"
$existingCss = [System.IO.File]::ReadAllText($cssPath)
$existingCss = [regex]::Replace(
  $existingCss,
  '(?s)/\* === LEXDATA ELLIPSUS V4 START === \*/.*?/\* === LEXDATA ELLIPSUS V4 END === \*/',
  ''
)
$combinedCss = $existingCss.TrimEnd() + "`r`n`r`n" + $cssPatch + "`r`n"
[System.IO.File]::WriteAllText($cssPath, $combinedCss, $utf8NoBom)
Write-Host "Updated app\ellipsus-home.css" -ForegroundColor Green

# Clear Next.js cache so old generated files are not reused.
$nextPath = Join-Path $root ".next"
if (Test-Path $nextPath) {
  Remove-Item -Recurse -Force $nextPath -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Ellipsus V4 navigation, About team wall, and editorial video showcase applied." -ForegroundColor Cyan
Write-Host "Backup saved outside project: $backupRoot" -ForegroundColor DarkGray
Write-Host ""
Write-Host "To add videos, edit:" -ForegroundColor Yellow
Write-Host "  content\editorialVideos.ts"
Write-Host ""
Write-Host "Then run:" -ForegroundColor Yellow
Write-Host "  npm.cmd run build"
Write-Host "  npm.cmd run dev"

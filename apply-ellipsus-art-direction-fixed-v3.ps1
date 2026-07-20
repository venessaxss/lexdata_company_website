$ErrorActionPreference = "Stop"

$root = Get-Location
if (!(Test-Path (Join-Path $root "package.json"))) {
  throw "Run this script from the Next.js project root (the folder containing package.json)."
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupRoot = Join-Path $root ("_ellipsus_art_backup_" + $stamp)
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

$nav = @'
"use client";

import Link from "next/link";
import { useState } from "react";

type MenuName = "library" | "about" | null;

export default function EllipsusNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [open, setOpen] = useState<MenuName>(null);

  const closeSoon = () => {
    window.setTimeout(() => setOpen(null), 120);
  };

  return (
    <header className="lx-site-nav">
      <div className="lx-nav-inner">
        <Link href="/" className="lx-logo" aria-label="LexData home">
          lexdata
        </Link>

        <nav className="lx-nav-links" aria-label="Primary navigation">
          <Link href="/#features" className="lx-nav-link">Features <span>v</span></Link>

          <div
            className="lx-nav-menu"
            onMouseEnter={() => setOpen("library")}
            onMouseLeave={closeSoon}
          >
            <button
              type="button"
              className={`lx-nav-link lx-nav-button ${open === "library" ? "is-open" : ""}`}
              onClick={() => setOpen(open === "library" ? null : "library")}
              aria-expanded={open === "library"}
            >
              Library <span>{open === "library" ? "^" : "v"}</span>
            </button>
            {open === "library" ? (
              <div className="lx-mega lx-mega-library">
                <div className="lx-mega-list">
                  <Link href="/workshops"><b>#</b><span>Workshops</span></Link>
                  <Link href="/#cases"><b>o</b><span>Research cases</span></Link>
                  <Link href="/#media"><b>*</b><span>Media library</span></Link>
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
            onMouseEnter={() => setOpen("about")}
            onMouseLeave={closeSoon}
          >
            <button
              type="button"
              className={`lx-nav-link lx-nav-button ${open === "about" ? "is-open" : ""}`}
              onClick={() => setOpen(open === "about" ? null : "about")}
              aria-expanded={open === "about"}
            >
              About <span>{open === "about" ? "^" : "v"}</span>
            </button>
            {open === "about" ? (
              <div className="lx-mega lx-mega-about">
                <div className="lx-mega-list">
                  <Link href="/about"><b>:)</b><span>Who we are</span></Link>
                  <Link href="/about#story"><b>P</b><span>Our story</span></Link>
                  <Link href="/about#team"><b>O</b><span>Meet the team</span></Link>
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

$teamWall = @'
"use client";

import { useMemo, useState } from "react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio?: string | null;
  section?: string | null;
  initials: string;
};

export default function AboutTeamWall({ members }: { members: TeamMember[] }) {
  const safeMembers = useMemo(
    () => members.length > 0 ? members : [
      { id: "research", name: "Research", role: "Language science", initials: "R", bio: "Research design, corpus work, and evidence-led inquiry." },
      { id: "training", name: "Training", role: "Workshops & learning", initials: "T", bio: "Hands-on learning experiences for researchers and professionals." },
      { id: "technology", name: "Technology", role: "AI & data systems", initials: "A", bio: "Practical tooling that keeps people in control of the workflow." },
    ],
    [members]
  );

  const [active, setActive] = useState(0);
  const selected = safeMembers[Math.min(active, safeMembers.length - 1)];

  return (
    <div className="lx-team-board">
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
            <span className="lx-team-place">{member.section || "LexData"} <b>@</b></span>
          </button>
        ))}
      </div>

      <article className="lx-team-feature" aria-live="polite">
        <div className="lx-team-doodle">{selected.initials}</div>
        <div className="lx-team-feature-copy">
          <p>{selected.role}</p>
          <h3>{selected.name}</h3>
          {selected.bio ? <span>{selected.bio}</span> : null}
        </div>
      </article>
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
              {canManage ? <Link href="/manager/registrations" className="lx-text-link">Review registrations </Link> : null}
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
        <div className="lx-editorial-heading">
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
          <Link href="/about" className="lx-final-link">Meet the people behind LexData </Link>
        </div>
      </section>
    </main>
  );
}
'@

$about = @'
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
    section: member.section || null,
    initials: initialsOf(member),
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

$css = @'
:root {
  --lx-paper: #f4f4f1;
  --lx-paper-2: #e9e9e5;
  --lx-ink: #0b0c0d;
  --lx-charcoal: #28292d;
  --lx-white: #fbfbf8;
  --lx-blue: #1f78c8;
  --lx-green: #2ca25f;
  --lx-red: #ff4f43;
  --lx-purple: #cc53f3;
  --lx-nav-h: 72px;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--lx-paper); }
.lx-page, .lx-about-page { color: var(--lx-ink); background: var(--lx-paper); overflow-x: clip; }

/* Ellipsus-inspired fixed navigation */
.lx-site-nav {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 1000;
  height: var(--lx-nav-h);
  background: rgba(250, 250, 247, .97);
  border-bottom: 1px solid rgba(11,12,13,.08);
  backdrop-filter: blur(12px);
}
.lx-nav-inner {
  height: 100%;
  width: min(1540px, calc(100% - 56px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 28px;
}
.lx-logo {
  color: var(--lx-ink);
  text-decoration: none;
  font-family: Fraunces, Georgia, serif;
  font-size: 40px;
  line-height: 1;
  letter-spacing: -.08em;
  font-weight: 500;
  justify-self: start;
}
.lx-nav-links { display: flex; align-items: center; gap: 34px; justify-self: center; }
.lx-nav-link {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--lx-ink);
  text-decoration: none;
  font: inherit;
  font-size: 16px;
  padding: 23px 0 21px;
  cursor: pointer;
  white-space: nowrap;
}
.lx-nav-link span { display: inline-block; margin-left: 7px; font-size: 14px; transition: transform .2s ease; }
.lx-nav-link.is-open { color: var(--lx-purple); }
.lx-nav-menu { position: relative; }
.lx-nav-actions { justify-self: end; display: flex; gap: 10px; }
.lx-login-btn, .lx-signup-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 19px;
  border-radius: 17px;
  text-decoration: none;
  font-size: 16px;
}
.lx-login-btn { color: var(--lx-ink); border: 1px solid var(--lx-ink); background: var(--lx-white); }
.lx-signup-btn { color: white; border: 1px solid var(--lx-ink); background: var(--lx-ink); }

.lx-mega {
  position: absolute;
  top: 62px;
  left: 50%;
  transform: translateX(-50%);
  width: min(900px, 78vw);
  min-height: 260px;
  padding: 46px 58px;
  border: 1px solid rgba(11,12,13,.12);
  border-radius: 28px;
  background: #fbfbfa;
  box-shadow: 0 24px 80px rgba(0,0,0,.16);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  overflow: hidden;
}
.lx-mega-about { width: min(680px, 76vw); }
.lx-mega-list { display: grid; align-content: center; gap: 28px; }
.lx-mega-list a { color: var(--lx-ink); text-decoration: none; display: flex; align-items: center; gap: 18px; font-size: 21px; }
.lx-mega-list a b { width: 28px; font-size: 24px; font-weight: 400; text-align: center; }
.lx-mega-list a:hover span { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 8px; }
.lx-mega-sketch { position: relative; min-height: 168px; }
.lx-sketch-page { position: absolute; width: 150px; height: 110px; border: 2px solid #1b1b1b; transform: rotate(12deg); left: 18px; top: 42px; }
.lx-sketch-page::before, .lx-sketch-page::after { content: ""; position: absolute; left: 22px; right: 22px; height: 1px; background: #1b1b1b; box-shadow: 0 16px 0 #1b1b1b, 0 32px 0 #1b1b1b; top: 28px; transform: rotate(-4deg); }
.lx-sketch-cup { position: absolute; right: 52px; top: 16px; border: 2px solid #1b1b1b; border-radius: 0 0 18px 18px; width: 58px; height: 76px; display: grid; place-items: center; font-size: 42px; transform: rotate(6deg); }
.lx-sketch-crumple { position: absolute; right: 8px; bottom: 6px; font-size: 52px; transform: rotate(-16deg); }
.lx-sketch-portrait { display: grid; place-items: center; }
.lx-sketch-portrait::before, .lx-sketch-portrait::after { content: ""; position: absolute; width: 124px; height: 150px; border: 2px solid #1b1b1b; transform: rotate(-8deg); }
.lx-sketch-portrait::after { transform: rotate(8deg) translate(22px, 4px); }
.lx-sketch-portrait span { position: relative; z-index: 2; font: 54px/1 Georgia, serif; }

/* Sticky hero + cover-on-scroll sequence */
.lx-cover-sequence { position: relative; padding-top: var(--lx-nav-h); background: var(--lx-charcoal); }
.lx-hero-sticky {
  position: sticky;
  top: var(--lx-nav-h);
  z-index: 1;
  height: calc(100vh - var(--lx-nav-h));
  min-height: 620px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--lx-charcoal);
  color: var(--lx-white);
}
.lx-hero-center { position: relative; z-index: 4; width: min(980px, calc(100% - 48px)); text-align: center; }
.lx-hero-center h1 {
  margin: 0;
  min-height: 1.2em;
  font-family: Fraunces, Georgia, serif;
  font-weight: 500;
  letter-spacing: -.055em;
  font-size: clamp(64px, 8vw, 126px);
  line-height: .98;
}
.lx-hero-center .ell-typewriter-prefix { color: inherit; }
.lx-hero-center .ell-typewriter-cursor { color: var(--lx-white); font-weight: 300; animation: lxBlink .8s steps(1) infinite; }
@keyframes lxBlink { 50% { opacity: 0; } }
.lx-hero-center > p { max-width: 600px; margin: 58px auto 0; font-size: clamp(18px, 2vw, 26px); line-height: 1.35; color: rgba(255,255,255,.9); }
.lx-hero-actions { margin-top: 44px; display: flex; flex-direction: column; gap: 16px; align-items: center; }
.lx-join-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 20px; border-radius: 12px; background: var(--lx-white); color: var(--lx-ink); text-decoration: none; font-weight: 700; }
.lx-text-link { color: white; text-decoration: none; font-size: 14px; }
.lx-floating-letters { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.lx-floating-letters span {
  position: absolute;
  left: calc(7% + ((var(--i) * 17) % 86) * 1%);
  top: calc(4% + ((var(--i) * 29) % 88) * 1%);
  color: rgba(255,255,255,.18);
  font: 18px/1 Georgia, serif;
  animation: lxDrift calc(7s + (var(--i) * .27s)) ease-in-out infinite alternate;
}
@keyframes lxDrift { to { transform: translate3d(calc((var(--i) % 3 - 1) * 18px), -28px, 0) rotate(8deg); opacity: .5; } }
.lx-plane { position: absolute; z-index: 2; width: 150px; fill: none; stroke: white; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; opacity: .9; }
.lx-plane-left { left: 8%; bottom: 18%; transform: rotate(-8deg); }
.lx-plane-right { right: 8%; top: 48%; stroke: #e777ff; transform: rotate(9deg); }

.lx-paper-cover {
  position: relative;
  z-index: 3;
  min-height: 190vh;
  background: var(--lx-paper);
  border-radius: 42px 42px 0 0;
  box-shadow: 0 -24px 80px rgba(0,0,0,.16);
  overflow: hidden;
}
.lx-wave-top { height: 90px; background: var(--lx-paper-2); clip-path: polygon(0 0,100% 0,100% 36%,86% 18%,64% 44%,44% 34%,25% 65%,0 28%); }
.lx-paper-intro { position: relative; min-height: 470px; padding: 150px max(8vw, 36px) 70px; display: flex; align-items: center; }
.lx-paper-intro h2 { margin: 0; max-width: 1100px; font: 500 clamp(66px, 9vw, 150px)/.95 Fraunces, Georgia, serif; letter-spacing: -.06em; }
.lx-paper-intro h2 em { color: var(--lx-blue); font-style: normal; }
.lx-book-stack { width: 250px; height: 210px; position: absolute; left: 7%; bottom: -34px; transform: rotate(5deg); opacity: .95; }
.lx-book-stack span { position: absolute; width: 170px; height: 58px; border: 3px solid #222; border-radius: 4px 12px 12px 4px; left: 0; background: var(--lx-paper); }
.lx-book-stack span:nth-child(1) { top: 10px; transform: rotate(8deg); }
.lx-book-stack span:nth-child(2) { top: 68px; left: 28px; transform: rotate(-4deg); }
.lx-book-stack span:nth-child(3) { top: 127px; left: 6px; transform: rotate(2deg); }
.lx-book-stack span::after { content: ""; position: absolute; left: 12px; right: 12px; bottom: 11px; height: 1px; background: #222; box-shadow: 0 -8px 0 #222; opacity: .65; }
.lx-paper-copy { padding: 100px max(10vw, 46px) 130px; max-width: 1450px; }
.lx-paper-copy p { margin: 0 0 72px; max-width: 1050px; font: 500 clamp(46px, 6vw, 90px)/1.03 Fraunces, Georgia, serif; letter-spacing: -.05em; }
.lx-paper-copy strong { font-weight: 600; font-style: italic; position: relative; }
.lx-squiggle-red::after { content: ""; position: absolute; left: 0; right: 0; bottom: -7px; height: 7px; border-bottom: 3px solid var(--lx-red); border-radius: 50%; transform: rotate(-1deg); }
.lx-circle-green::after { content: ""; position: absolute; inset: -8px -14px -5px; border: 2px solid var(--lx-green); border-radius: 50%; transform: rotate(-2deg); }

.lx-ai-stance { min-height: 900px; padding: 100px 8vw 120px; display: grid; grid-template-columns: .95fr 1.05fr; gap: 8vw; align-items: center; background: #f7f7f4; }
.lx-robot { position: relative; min-height: 640px; }
.lx-robot-head { position: absolute; left: 13%; top: 4%; width: 340px; height: 230px; border: 4px solid #222; border-radius: 48% 52% 44% 56%; transform: rotate(5deg); display: flex; align-items: center; justify-content: space-evenly; font: 70px/1 Georgia, serif; }
.lx-robot-body { position: absolute; left: 5%; top: 240px; width: 500px; height: 300px; border: 4px solid #222; border-radius: 42% 48% 18% 20%; display: grid; place-items: center; font-size: 120px; transform: rotate(-3deg); }
.lx-paper-bin { position: absolute; right: 2%; top: 260px; width: 190px; min-height: 180px; border: 4px solid #222; padding: 40px 20px; font-size: 44px; transform: rotate(8deg); }
.lx-ai-copy { align-self: start; padding-top: 40px; }
.lx-ai-copy p { margin: 0; font-size: clamp(35px, 4vw, 64px); line-height: 1.28; letter-spacing: -.035em; }
.lx-ai-copy small { display: block; margin-top: 70px; font-size: 20px; color: var(--lx-green); }
.lx-underline-green { position: relative; }
.lx-underline-green::after { content: ""; position: absolute; left: 0; right: 0; bottom: -5px; border-bottom: 3px solid var(--lx-green); transform: rotate(-1deg); }
.lx-circle-red { position: relative; white-space: nowrap; }
.lx-circle-red::after { content: ""; position: absolute; inset: -7px -12px; border: 2px solid var(--lx-red); border-radius: 50%; transform: rotate(3deg); }

.lx-showcase-shell { position: relative; z-index: 4; padding: 100px 0 80px; background: #000; color: white; }
.lx-section-kicker { text-align: center; font-weight: 800; letter-spacing: .02em; padding: 0 24px 44px; font-size: clamp(16px, 2vw, 26px); }
.lx-editorial-section, .lx-media-section { position: relative; z-index: 4; padding: 120px max(6vw, 28px); background: var(--lx-paper); }
.lx-media-section { background: #efefec; }
.lx-editorial-heading { max-width: 1120px; margin: 0 auto 70px; }
.lx-editorial-heading > p { margin: 0 0 18px; font-size: 15px; text-transform: uppercase; letter-spacing: .18em; }
.lx-editorial-heading h2 { margin: 0; font: 500 clamp(54px, 7vw, 110px)/.94 Fraunces, Georgia, serif; letter-spacing: -.055em; }
.lx-case-grid { width: min(1320px, 100%); margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
.lx-case-card { min-height: 360px; padding: 30px; border: 1px solid #171717; border-radius: 28px; background: #fafaf7; display: flex; flex-direction: column; }
.lx-case-card:nth-child(2) { transform: translateY(38px) rotate(1deg); }
.lx-case-card:nth-child(3) { transform: rotate(-1deg); }
.lx-case-card span { font-size: 13px; text-transform: uppercase; letter-spacing: .16em; }
.lx-case-card h3 { margin: auto 0 22px; font: 500 40px/1 Fraunces, Georgia, serif; letter-spacing: -.04em; }
.lx-case-card p { margin: 0; max-width: 36ch; line-height: 1.55; }
.lx-final-cta { position: relative; z-index: 4; background: #000; color: white; padding: 140px max(7vw, 28px); text-align: center; }
.lx-final-cta > p { text-transform: uppercase; letter-spacing: .2em; font-size: 13px; }
.lx-final-cta h2 { max-width: 1050px; margin: 24px auto 54px; font: 500 clamp(54px, 7vw, 110px)/.95 Fraunces, Georgia, serif; letter-spacing: -.05em; }
.lx-final-cta > div { display: flex; gap: 24px; justify-content: center; align-items: center; flex-wrap: wrap; }
.lx-final-link { color: white; text-decoration: none; }

/* About page */
.lx-about-page { padding-top: var(--lx-nav-h); }
.lx-about-hero { position: relative; min-height: calc(100vh - var(--lx-nav-h)); display: grid; place-items: center; overflow: hidden; background: var(--lx-charcoal); color: white; }
.lx-about-hero h1 { position: relative; z-index: 2; width: min(1200px, calc(100% - 40px)); margin: 0; text-align: center; font: 500 clamp(72px, 10vw, 160px)/.95 Fraunces, Georgia, serif; letter-spacing: -.065em; }
.lx-about-letters span { color: rgba(255,255,255,.16); }
.lx-about-story { min-height: 100vh; padding: 150px max(8vw, 34px); display: grid; grid-template-columns: 90px minmax(0, 930px) 1fr; gap: 60px; align-items: start; background: var(--lx-paper); }
.lx-story-mark { font: 500 74px/1 Fraunces, Georgia, serif; color: var(--lx-blue); }
.lx-story-kicker { text-transform: uppercase; letter-spacing: .2em; font-size: 13px; }
.lx-about-story h2 { margin: 14px 0 50px; font: 500 clamp(56px, 7vw, 105px)/.98 Fraunces, Georgia, serif; letter-spacing: -.055em; }
.lx-about-story div:nth-child(2) > p:not(.lx-story-kicker) { font-size: clamp(20px, 2.2vw, 30px); line-height: 1.5; max-width: 42em; }
.lx-story-doodle { align-self: center; justify-self: center; font-size: 92px; line-height: 1.5; transform: rotate(8deg); }
.lx-team-section { min-height: 100vh; padding: 110px max(6vw, 28px) 130px; background: #000; color: white; overflow: hidden; }
.lx-team-title { width: min(1500px, 100%); margin: 0 auto 54px; text-align: right; }
.lx-team-title p { text-transform: uppercase; letter-spacing: .18em; font-size: 13px; }
.lx-team-title h2 { margin: 0; font: 500 clamp(70px, 9vw, 150px)/.9 Fraunces, Georgia, serif; letter-spacing: -.06em; }
.lx-team-board { position: relative; width: min(1500px, 100%); margin: 0 auto; min-height: 720px; }
.lx-team-list { padding-top: 70px; }
.lx-team-row { width: 100%; min-height: 108px; padding: 0 6px; display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; gap: 28px; border: 0; border-bottom: 1px solid rgba(255,255,255,.48); background: transparent; color: rgba(255,255,255,.48); text-align: left; cursor: pointer; font: inherit; transition: color .2s ease, transform .2s ease; }
.lx-team-row:hover, .lx-team-row.is-active { color: white; transform: translateX(8px); }
.lx-team-name { font-size: 28px; }
.lx-team-row.is-active .lx-team-name { position: relative; color: white; }
.lx-team-row.is-active .lx-team-name::after { content: ""; position: absolute; left: -24px; top: 50%; width: 190px; height: 58px; border: 2px solid #ff9b23; border-radius: 50%; transform: translateY(-50%) rotate(2deg); }
.lx-team-role, .lx-team-place { font-size: 20px; }
.lx-team-place { text-align: right; }
.lx-team-feature { position: absolute; left: 15%; top: 0; width: 440px; min-height: 540px; border-radius: 18px; background: #f3f3ef; color: var(--lx-ink); transform: rotate(8deg); overflow: hidden; box-shadow: 0 30px 90px rgba(0,0,0,.35); pointer-events: none; }
.lx-team-doodle { min-height: 370px; display: grid; place-items: center; font: 500 150px/1 Fraunces, Georgia, serif; background: repeating-linear-gradient(0deg, transparent 0 22px, rgba(0,0,0,.05) 22px 23px), #f7f7f3; }
.lx-team-feature-copy { padding: 24px 28px 30px; }
.lx-team-feature-copy p { margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: .14em; }
.lx-team-feature-copy h3 { margin: 8px 0; font: 500 40px/1 Fraunces, Georgia, serif; }
.lx-team-feature-copy span { color: #555; line-height: 1.45; }

@media (max-width: 980px) {
  :root { --lx-nav-h: 64px; }
  .lx-nav-inner { width: calc(100% - 24px); grid-template-columns: auto 1fr auto; gap: 12px; }
  .lx-logo { font-size: 32px; }
  .lx-nav-links { gap: 16px; overflow-x: auto; justify-self: stretch; justify-content: center; }
  .lx-nav-link { font-size: 14px; }
  .lx-signup-btn { display: none; }
  .lx-mega { position: fixed; top: 64px; left: 12px; right: 12px; width: auto; transform: none; grid-template-columns: 1fr; padding: 30px; }
  .lx-mega-sketch { display: none; }
  .lx-plane { width: 100px; opacity: .5; }
  .lx-paper-intro { min-height: 390px; padding-top: 120px; }
  .lx-book-stack { transform: scale(.72) rotate(5deg); transform-origin: left bottom; }
  .lx-ai-stance { grid-template-columns: 1fr; min-height: auto; }
  .lx-robot { min-height: 520px; transform: scale(.8); transform-origin: left top; }
  .lx-case-grid { grid-template-columns: 1fr; }
  .lx-case-card:nth-child(2), .lx-case-card:nth-child(3) { transform: none; }
  .lx-about-story { grid-template-columns: 1fr; gap: 24px; }
  .lx-story-doodle { display: none; }
  .lx-team-board { min-height: auto; }
  .lx-team-feature { position: relative; left: auto; top: auto; margin: 0 auto 38px; width: min(440px, 92%); transform: rotate(3deg); }
  .lx-team-list { padding-top: 0; }
  .lx-team-row { grid-template-columns: 1fr 1fr; }
  .lx-team-place { display: none; }
}

@media (max-width: 640px) {
  .lx-nav-links .lx-nav-link:first-child, .lx-nav-links > a:last-child { display: none; }
  .lx-login-btn { min-height: 40px; padding: 0 13px; border-radius: 14px; font-size: 14px; }
  .lx-hero-sticky { min-height: 560px; }
  .lx-hero-center > p { margin-top: 34px; }
  .lx-paper-cover { border-radius: 26px 26px 0 0; }
  .lx-paper-intro { min-height: 330px; padding: 92px 22px 40px; }
  .lx-paper-copy { padding: 70px 24px 90px; }
  .lx-ai-stance { padding: 70px 24px; }
  .lx-robot { min-height: 390px; transform: scale(.58); }
  .lx-about-story, .lx-team-section { padding-left: 24px; padding-right: 24px; }
  .lx-team-row { grid-template-columns: 1fr; min-height: 88px; }
  .lx-team-role { font-size: 15px; }
}
'@

Write-ProjectFile "components\EllipsusNav.tsx" $nav
Write-ProjectFile "components\AboutTeamWall.tsx" $teamWall
Write-ProjectFile "components\IntegratedHomePage.tsx" $homePageContent
Write-ProjectFile "app\about\page.tsx" $about
Write-ProjectFile "app\ellipsus-home.css" $css

# Ensure the stylesheet is imported exactly once.
$globalsPath = Join-Path $root "app\globals.css"
if (Test-Path $globalsPath) {
  Backup-File "app\globals.css"
  $globals = [System.IO.File]::ReadAllText($globalsPath)
  if ($globals -notmatch '@import\s+["'']\.\/ellipsus-home\.css["'']') {
    $globals = '@import "./ellipsus-home.css";' + "`r`n" + $globals
    [System.IO.File]::WriteAllText($globalsPath, $globals, $utf8NoBom)
    Write-Host "Patched app\globals.css" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Ellipsus-style art direction applied." -ForegroundColor Cyan
Write-Host "Backup: $backupRoot" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Now run:" -ForegroundColor Yellow
Write-Host "  npm.cmd run build"
Write-Host "  npm.cmd run dev"

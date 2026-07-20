$ErrorActionPreference = "Stop"

$root = Get-Location
if (!(Test-Path (Join-Path $root "package.json"))) {
  throw "Run this script from the Next.js project root (the folder containing package.json)."
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$parentRoot = Split-Path $root -Parent
$backupBase = Join-Path $parentRoot "lexdata_ellipsus_backups"
New-Item -ItemType Directory -Force $backupBase | Out-Null

# Keep all generated backups outside the Next.js project so TypeScript does not scan them.
Get-ChildItem -Path $root -Directory -Filter "_ellipsus_art_backup_*" -ErrorAction SilentlyContinue | ForEach-Object {
  $target = Join-Path $backupBase $_.Name
  if (Test-Path $target) { $target = Join-Path $backupBase ($_.Name + "_" + $stamp) }
  Move-Item $_.FullName $target -Force
}

$backupRoot = Join-Path $backupBase ("ellipsus_v5_backup_" + $stamp)
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const safeIndex = visibleVideos.length ? activeIndex % visibleVideos.length : 0;
  const active = visibleVideos[safeIndex];
  const previous = visibleVideos.length > 1
    ? visibleVideos[(safeIndex - 1 + visibleVideos.length) % visibleVideos.length]
    : null;
  const next = visibleVideos.length > 1
    ? visibleVideos[(safeIndex + 1) % visibleVideos.length]
    : null;

  useEffect(() => {
    setPlaying(false);
  }, [safeIndex]);

  if (!active) return null;

  const canPlay = Boolean(active.src);
  const posterStyle = active.poster ? { backgroundImage: `url(${active.poster})` } : undefined;

  const goPrevious = () => {
    if (visibleVideos.length < 2) return;
    setActiveIndex((current) => (current - 1 + visibleVideos.length) % visibleVideos.length);
  };

  const goNext = () => {
    if (visibleVideos.length < 2) return;
    setActiveIndex((current) => (current + 1) % visibleVideos.length);
  };

  return (
    <div className="lx-editorial-video">
      <div className="lx-editorial-video-copy">
        <p>{active.eyebrow}</p>
        <h3>{active.title}</h3>
        {active.description ? <span>{active.description}</span> : null}
      </div>

      <div className="lx-video-carousel-stage">
        <button type="button" className="lx-video-arrow lx-video-arrow-left" onClick={goPrevious} disabled={!previous} aria-label="Previous video">
          <span />
        </button>

        <div
          className={`lx-video-side-card lx-video-side-left ${previous?.poster ? "has-poster" : ""}`}
          style={previous?.poster ? { backgroundImage: `url(${previous.poster})` } : undefined}
          aria-hidden="true"
        />

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
              <div className="lx-video-paper-preview" aria-hidden="true">
                <div className="lx-video-paper-sheet">
                  <b>Research note</b>
                  <i /><i /><i /><i /><i />
                </div>
                <div className="lx-video-paper-float lx-video-paper-float-one">Draft</div>
                <div className="lx-video-paper-float lx-video-paper-float-two">Review</div>
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

        <div
          className={`lx-video-side-card lx-video-side-right ${next?.poster ? "has-poster" : ""}`}
          style={next?.poster ? { backgroundImage: `url(${next.poster})` } : undefined}
          aria-hidden="true"
        />

        <button type="button" className="lx-video-arrow lx-video-arrow-right" onClick={goNext} disabled={!next} aria-label="Next video">
          <span />
        </button>
      </div>

      <div className="lx-video-caption">{active.title.toUpperCase()}</div>

      {visibleVideos.length > 1 ? (
        <div className="lx-video-picker" aria-label="Choose video">
          {visibleVideos.map((video, index) => (
            <button
              key={video.id}
              type="button"
              className={index === safeIndex ? "is-active" : ""}
              onClick={() => setActiveIndex(index)}
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

      <section className="lx-showcase-shell lx-dashboard-section">
        <div className="lx-dashboard-intro">
          <div className="lx-dashboard-doodle lx-dashboard-doodle-left" aria-hidden="true">
            <span className="lx-doodle-cup" />
            <span className="lx-doodle-books" />
          </div>
          <div className="lx-dashboard-copy">
            <p>One connected workspace</p>
            <h2>Dashboards, drafts, cases, and discussions</h2>
            <span>Keep the serious work organized without making the interface feel corporate. Move from research to review to feedback in one visual flow.</span>
          </div>
          <div className="lx-dashboard-doodle lx-dashboard-doodle-right" aria-hidden="true">
            <span className="lx-doodle-plant" />
            <span className="lx-doodle-pen" />
          </div>
        </div>
        <div className="lx-dashboard-stage">
          <div className="lx-dashboard-side lx-dashboard-side-left" aria-hidden="true"><i /><i /></div>
          <div className="lx-dashboard-main"><DynamicHomeShowcase /></div>
          <div className="lx-dashboard-side lx-dashboard-side-right" aria-hidden="true"><i /><i /></div>
        </div>
        <div className="lx-dashboard-caption">WRITE, REVIEW, SHARE, REPEAT</div>
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

      <section className="lx-notification-section" id="notifications">
        <div className="lx-notification-heading">
          <p>Stay in the loop</p>
          <h2>Notifications that feel like notes, not noise.</h2>
          <span>Workshop updates, registration activity, case changes, and team messages stay visible without interrupting the work.</span>
        </div>
        <div className="lx-notification-board">
          <div className="lx-notification-sketch" aria-hidden="true">
            <i className="lx-bell-line" />
            <i className="lx-note-line lx-note-line-one" />
            <i className="lx-note-line lx-note-line-two" />
          </div>
          <div className="lx-notification-live">
            <NoticeSpotlight />
          </div>
        </div>
      </section>

      <section className="lx-media-section" id="media">
        <div className="lx-media-black-intro">
          <div className="lx-media-doodle lx-media-doodle-left" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <p>Video and media</p>
            <h2>See the work move.</h2>
            <span>Use video for workshop highlights, platform walkthroughs, research explainers, and project stories.</span>
          </div>
          <div className="lx-media-doodle lx-media-doodle-right" aria-hidden="true"><span /><span /></div>
        </div>

        <div className="lx-video-blue-shell">
          <EditorialVideoShowcase videos={editorialVideos} />
        </div>

        <div className="lx-media-library-shell">
          <div className="lx-editorial-heading lx-media-secondary-heading">
            <p>Media library</p>
            <h2>More clips, workshops, and highlights.</h2>
          </div>
          <HomeMediaShowcase videos={[]} />
          <HomeVideoSpotlight />
          <LatestWorkshopVideos />
        </div>
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

$cssPatch = @'
/* === LEXDATA ELLIPSUS V5 START === */

/* Lighter, smaller editorial typography */
.lx-paper-intro h2 {
  max-width: 980px;
  font-size: clamp(46px, 6.2vw, 96px);
  font-weight: 400;
  line-height: 1.02;
  letter-spacing: -.045em;
}
.lx-paper-copy {
  max-width: 1320px;
  padding-top: 88px;
  padding-bottom: 110px;
}
.lx-paper-copy p {
  max-width: 1180px;
  margin-bottom: 70px;
  font-size: clamp(34px, 4.6vw, 68px);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -.04em;
}
.lx-paper-copy strong { font-weight: 500; }
.lx-editorial-heading h2,
.lx-final-cta h2 {
  font-size: clamp(44px, 5.5vw, 84px);
  font-weight: 400;
  line-height: 1;
  letter-spacing: -.045em;
}
.lx-team-title h2 { font-weight: 400; }

/* Dashboard showcase now reads as part of the same hand-drawn editorial system */
.lx-dashboard-section {
  padding: 0 0 72px;
  overflow: hidden;
  background: #000;
}
.lx-dashboard-intro {
  position: relative;
  min-height: 320px;
  display: grid;
  grid-template-columns: 1fr minmax(380px, 760px) 1fr;
  align-items: center;
  gap: 34px;
  padding: 54px max(4vw, 26px) 38px;
}
.lx-dashboard-copy { text-align: center; }
.lx-dashboard-copy > p {
  margin: 0 0 14px;
  color: rgba(255,255,255,.58);
  font-size: 12px;
  letter-spacing: .18em;
  text-transform: uppercase;
}
.lx-dashboard-copy h2 {
  margin: 0;
  font: 400 clamp(42px, 5.2vw, 78px)/.98 Fraunces, Georgia, serif;
  letter-spacing: -.045em;
  color: #fff;
}
.lx-dashboard-copy > span {
  display: block;
  max-width: 760px;
  margin: 28px auto 0;
  color: rgba(255,255,255,.82);
  font-size: clamp(15px, 1.25vw, 19px);
  line-height: 1.45;
}
.lx-dashboard-doodle { position: relative; min-height: 180px; opacity: .88; }
.lx-doodle-books,
.lx-doodle-cup,
.lx-doodle-plant,
.lx-doodle-pen { position: absolute; display: block; border: 2px solid rgba(255,255,255,.82); }
.lx-doodle-books { width: 150px; height: 72px; left: 24%; bottom: 28px; border-radius: 3px; box-shadow: 0 -18px 0 -2px #000, 0 -18px 0 0 rgba(255,255,255,.82), 0 -36px 0 -2px #000, 0 -36px 0 0 rgba(255,255,255,.82); transform: skewX(-8deg); }
.lx-doodle-cup { width: 64px; height: 56px; left: 43%; top: 10px; border-radius: 0 0 16px 16px; }
.lx-doodle-cup::after { content: ""; position: absolute; width: 22px; height: 25px; right: -24px; top: 8px; border: 2px solid rgba(255,255,255,.82); border-left: 0; border-radius: 0 18px 18px 0; }
.lx-doodle-plant { width: 76px; height: 70px; right: 29%; bottom: 20px; border-radius: 10px 10px 26px 26px; }
.lx-doodle-plant::before,
.lx-doodle-plant::after { content: ""; position: absolute; width: 34px; height: 62px; top: -54px; border: 2px solid rgba(255,255,255,.82); border-radius: 60% 10% 60% 10%; }
.lx-doodle-plant::before { left: 2px; transform: rotate(-24deg); }
.lx-doodle-plant::after { right: 3px; transform: rotate(26deg) scaleX(-1); }
.lx-doodle-pen { width: 18px; height: 142px; right: 13%; top: 7px; border-radius: 50% 50% 8px 8px; transform: rotate(8deg); }
.lx-dashboard-stage {
  position: relative;
  width: min(1540px, 118vw);
  margin-left: 50%;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: minmax(220px, .7fr) minmax(720px, 1.55fr) minmax(220px, .7fr);
  gap: 34px;
  align-items: stretch;
}
.lx-dashboard-side,
.lx-dashboard-main {
  min-height: 430px;
  border-radius: 22px;
  background: #2879bd;
  overflow: hidden;
}
.lx-dashboard-main { padding: 18px; }
.lx-dashboard-main > * {
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background: #f4f2ed;
}
.lx-dashboard-side { position: relative; opacity: .96; }
.lx-dashboard-side i {
  position: absolute;
  display: block;
  width: 72%;
  height: 78%;
  top: 16%;
  background: #f7f6f1;
  border-radius: 18px;
  box-shadow: 0 14px 28px rgba(0,0,0,.16);
}
.lx-dashboard-side i::before,
.lx-dashboard-side i::after { content: ""; position: absolute; left: 12%; right: 12%; height: 9px; background: rgba(0,0,0,.1); border-radius: 10px; }
.lx-dashboard-side i::before { top: 18%; box-shadow: 0 34px 0 rgba(0,0,0,.08), 0 68px 0 rgba(0,0,0,.08), 0 102px 0 rgba(0,0,0,.08); }
.lx-dashboard-side-left i { right: -12%; }
.lx-dashboard-side-right i { left: -12%; }
.lx-dashboard-side i:nth-child(2) { width: 32%; height: 26%; top: 43%; background: #fff; }
.lx-dashboard-side-left i:nth-child(2) { right: 3%; }
.lx-dashboard-side-right i:nth-child(2) { left: 3%; }
.lx-dashboard-caption,
.lx-video-caption {
  padding: 30px 20px 0;
  text-align: center;
  color: #fff;
  font-size: clamp(15px, 1.35vw, 21px);
  font-weight: 650;
  letter-spacing: .02em;
}

/* Notification section uses the existing live NoticeSpotlight component */
.lx-notification-section {
  position: relative;
  z-index: 4;
  padding: 120px max(6vw, 28px) 135px;
  background: #ecece8;
  color: #111;
  overflow: hidden;
}
.lx-notification-heading {
  width: min(1150px, 100%);
  margin: 0 auto 62px;
}
.lx-notification-heading > p {
  margin: 0 0 18px;
  color: #2879bd;
  font-size: 13px;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: .14em;
}
.lx-notification-heading h2 {
  max-width: 900px;
  margin: 0;
  font: 400 clamp(44px, 5.4vw, 82px)/1 Fraunces, Georgia, serif;
  letter-spacing: -.045em;
}
.lx-notification-heading > span {
  display: block;
  max-width: 760px;
  margin-top: 28px;
  color: #555;
  font-size: clamp(16px, 1.25vw, 19px);
  line-height: 1.55;
}
.lx-notification-board {
  position: relative;
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 58px 54px 54px;
  border: 1px solid rgba(0,0,0,.18);
  border-radius: 24px;
  background: #f8f7f2;
  box-shadow: 0 22px 60px rgba(0,0,0,.08);
}
.lx-notification-live { position: relative; z-index: 2; }
.lx-notification-live > * { margin: 0 !important; }
.lx-notification-sketch { position: absolute; right: 32px; top: -44px; width: 190px; height: 150px; transform: rotate(5deg); opacity: .72; pointer-events: none; }
.lx-bell-line { position: absolute; width: 70px; height: 76px; right: 34px; top: 24px; border: 3px solid #111; border-radius: 55% 55% 30% 30%; border-bottom-width: 5px; }
.lx-bell-line::before { content: ""; position: absolute; width: 12px; height: 12px; left: 50%; bottom: -16px; transform: translateX(-50%); border: 3px solid #111; border-radius: 50%; }
.lx-note-line { position: absolute; height: 2px; background: #2879bd; border-radius: 50%; transform-origin: left center; }
.lx-note-line-one { width: 86px; left: 8px; top: 38px; transform: rotate(-18deg); }
.lx-note-line-two { width: 62px; left: 18px; top: 68px; transform: rotate(11deg); }

/* Video section: black editorial intro flowing into an Ellipsus-like blue carousel */
.lx-media-section {
  padding: 0;
  background: #000;
  color: #fff;
  overflow: hidden;
}
.lx-media-black-intro {
  position: relative;
  min-height: 330px;
  display: grid;
  grid-template-columns: 1fr minmax(420px, 760px) 1fr;
  align-items: center;
  gap: 24px;
  padding: 70px max(5vw, 28px) 54px;
  text-align: center;
}
.lx-media-black-intro > div:nth-child(2) > p {
  margin: 0 0 14px;
  color: rgba(255,255,255,.58);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .18em;
}
.lx-media-black-intro h2 {
  margin: 0;
  font: 400 clamp(42px, 5.2vw, 78px)/.98 Fraunces, Georgia, serif;
  letter-spacing: -.045em;
}
.lx-media-black-intro > div:nth-child(2) > span {
  display: block;
  max-width: 700px;
  margin: 26px auto 0;
  color: rgba(255,255,255,.82);
  font-size: clamp(15px, 1.2vw, 18px);
  line-height: 1.5;
}
.lx-media-doodle { position: relative; min-height: 150px; opacity: .72; }
.lx-media-doodle span { position: absolute; display: block; border: 2px solid rgba(255,255,255,.85); }
.lx-media-doodle-left span:nth-child(1) { width: 120px; height: 76px; left: 18%; top: 48px; border-radius: 4px; transform: skewX(-9deg); }
.lx-media-doodle-left span:nth-child(2) { width: 100px; height: 8px; left: 24%; top: 38px; border-width: 2px 0 0; }
.lx-media-doodle-left span:nth-child(3) { width: 58px; height: 42px; left: 41%; top: 4px; border-radius: 0 0 12px 12px; }
.lx-media-doodle-right span:nth-child(1) { width: 72px; height: 72px; right: 27%; top: 48px; border-radius: 40% 40% 20% 20%; }
.lx-media-doodle-right span:nth-child(2) { width: 14px; height: 128px; right: 12%; top: 5px; border-radius: 50%; transform: rotate(7deg); }
.lx-video-blue-shell {
  padding: 0 0 72px;
  background: #000;
}
.lx-editorial-video {
  width: 100%;
  margin: 0;
  text-align: center;
}
.lx-editorial-video-copy {
  max-width: 820px;
  margin: 0 auto 44px;
  padding: 0 24px;
}
.lx-editorial-video-copy > p { color: #fff; opacity: .6; font-weight: 500; font-size: 12px; }
.lx-editorial-video-copy h3 {
  color: #fff;
  font-size: clamp(38px, 4.6vw, 68px);
  font-weight: 400;
  line-height: 1;
  letter-spacing: -.04em;
}
.lx-editorial-video-copy span { color: rgba(255,255,255,.75); font-size: 17px; }
.lx-video-carousel-stage {
  position: relative;
  width: min(1660px, 116vw);
  margin-left: 50%;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: minmax(260px, .7fr) minmax(760px, 1.5fr) minmax(260px, .7fr);
  gap: 34px;
  align-items: center;
}
.lx-video-frame,
.lx-video-side-card {
  aspect-ratio: 16 / 9;
  border: 0;
  border-radius: 20px;
  background-color: #2879bd;
  background-position: center;
  background-size: cover;
  box-shadow: none;
}
.lx-video-frame { position: relative; overflow: hidden; }
.lx-video-frame.no-poster { background: #2879bd; }
.lx-video-side-card { opacity: .98; }
.lx-video-paper-preview { position: absolute; inset: 0; display: grid; place-items: center; }
.lx-video-paper-sheet {
  position: relative;
  width: 52%;
  height: 78%;
  padding: 10% 9%;
  border-radius: 18px;
  background: #f7f6f1;
  color: #222;
  box-shadow: 0 18px 34px rgba(0,0,0,.2);
}
.lx-video-paper-sheet b { font: 500 clamp(22px, 2.2vw, 40px)/1 Fraunces, Georgia, serif; }
.lx-video-paper-sheet i { display: block; height: 6px; margin-top: 9%; border-radius: 8px; background: rgba(0,0,0,.12); }
.lx-video-paper-sheet i:nth-of-type(2) { width: 88%; }
.lx-video-paper-sheet i:nth-of-type(3) { width: 94%; }
.lx-video-paper-sheet i:nth-of-type(4) { width: 75%; }
.lx-video-paper-sheet i:nth-of-type(5) { width: 90%; }
.lx-video-paper-float {
  position: absolute;
  min-width: 160px;
  padding: 18px 22px;
  border-radius: 14px;
  background: #fff;
  color: #111;
  box-shadow: 0 12px 24px rgba(0,0,0,.18);
  text-align: left;
  font-size: 14px;
}
.lx-video-paper-float-one { left: 13%; top: 24%; transform: rotate(-3deg); }
.lx-video-paper-float-two { right: 12%; bottom: 23%; transform: rotate(3deg); }
.lx-video-arrow {
  position: absolute;
  z-index: 6;
  top: 50%;
  width: 86px;
  height: 86px;
  transform: translateY(-50%);
  border: 1.5px solid rgba(255,255,255,.9);
  border-radius: 50%;
  background: rgba(0,0,0,.15);
  cursor: pointer;
}
.lx-video-arrow:disabled { opacity: .25; cursor: default; }
.lx-video-arrow-left { left: calc(25% - 43px); }
.lx-video-arrow-right { right: calc(25% - 43px); }
.lx-video-arrow span { position: absolute; width: 34px; height: 34px; top: 50%; left: 50%; border-top: 2px solid #fff; border-left: 2px solid #fff; }
.lx-video-arrow-left span { transform: translate(-35%, -50%) rotate(-45deg); }
.lx-video-arrow-right span { transform: translate(-65%, -50%) rotate(135deg); }
.lx-video-play { width: 78px; height: 78px; background: #fff; }
.lx-video-play span { margin-left: 31px; border-left-color: #2879bd; border-top-width: 12px; border-bottom-width: 12px; border-left-width: 19px; }
.lx-video-caption { padding-top: 28px; }
.lx-video-picker { width: min(1100px, calc(100% - 48px)); margin: 30px auto 0; }
.lx-video-picker button { background: #111; color: #fff; border-color: rgba(255,255,255,.22); }
.lx-video-picker button.is-active { border-color: #fff; box-shadow: inset 0 0 0 1px #fff; }
.lx-video-picker small { color: rgba(255,255,255,.5); }
.lx-media-library-shell {
  padding: 115px max(6vw, 28px) 120px;
  background: #efefec;
  color: #111;
}
.lx-media-secondary-heading { margin-top: 0; }

@media (max-width: 980px) {
  .lx-dashboard-intro,
  .lx-media-black-intro { grid-template-columns: 1fr; min-height: auto; }
  .lx-dashboard-doodle,
  .lx-media-doodle { display: none; }
  .lx-dashboard-stage,
  .lx-video-carousel-stage { width: calc(100% - 32px); grid-template-columns: 1fr; gap: 0; }
  .lx-dashboard-side,
  .lx-video-side-card { display: none; }
  .lx-dashboard-main { min-height: 380px; }
  .lx-video-arrow-left { left: 18px; }
  .lx-video-arrow-right { right: 18px; }
  .lx-video-frame { width: 100%; }
  .lx-notification-board { padding: 42px 24px 28px; }
  .lx-notification-sketch { opacity: .35; }
}

@media (max-width: 640px) {
  .lx-paper-copy p { font-size: clamp(31px, 10vw, 48px); }
  .lx-dashboard-copy h2,
  .lx-media-black-intro h2,
  .lx-notification-heading h2 { font-size: clamp(38px, 11vw, 58px); }
  .lx-dashboard-main { min-height: 300px; padding: 10px; }
  .lx-video-arrow { width: 58px; height: 58px; }
  .lx-video-arrow span { width: 24px; height: 24px; }
  .lx-video-paper-float { min-width: 110px; padding: 10px 12px; font-size: 11px; }
  .lx-media-library-shell { padding-left: 20px; padding-right: 20px; }
}

/* === LEXDATA ELLIPSUS V5 END === */
'@

Write-ProjectFile "components\EditorialVideoShowcase.tsx" $videoShowcaseContent
Write-ProjectFile "components\IntegratedHomePage.tsx" $homePageContent

$cssPath = Join-Path $root "app\ellipsus-home.css"
if (!(Test-Path $cssPath)) {
  throw "app\ellipsus-home.css was not found. Apply the Ellipsus art-direction patch first."
}

Backup-File "app\ellipsus-home.css"
$existingCss = [System.IO.File]::ReadAllText($cssPath)
$existingCss = [regex]::Replace(
  $existingCss,
  '(?s)/\* === LEXDATA ELLIPSUS V5 START === \*/.*?/\* === LEXDATA ELLIPSUS V5 END === \*/',
  ''
)
$combinedCss = $existingCss.TrimEnd() + "`r`n`r`n" + $cssPatch + "`r`n"
[System.IO.File]::WriteAllText($cssPath, $combinedCss, $utf8NoBom)
Write-Host "Updated app\ellipsus-home.css" -ForegroundColor Green

$nextPath = Join-Path $root ".next"
if (Test-Path $nextPath) {
  Remove-Item -Recurse -Force $nextPath -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Ellipsus V5 applied: lighter typography, dashboard styling, video carousel styling, and notifications section." -ForegroundColor Cyan
Write-Host "Now run: npm.cmd run build" -ForegroundColor Yellow

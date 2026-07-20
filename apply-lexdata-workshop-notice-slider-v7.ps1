$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = (Get-Location).Path
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$parent = Split-Path $root -Parent
$backupRoot = Join-Path $parent ("lexdata_workshop_slider_backup_" + $stamp)

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

function Write-Utf8File([string]$Path, [string]$Content) {
    $dir = Split-Path $Path -Parent
    if ($dir -and !(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Backup-File([string]$RelativePath) {
    $src = Join-Path $root $RelativePath

    if (Test-Path $src) {
        $dest = Join-Path $backupRoot $RelativePath
        $destDir = Split-Path $dest -Parent

        if ($destDir) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }

        Copy-Item $src $dest -Force
    }
}

Write-Host "LexData workshop notice slider V7" -ForegroundColor Cyan
Write-Host "Project root: $root"
Write-Host "Backup: $backupRoot"
Write-Host ""

if (!(Test-Path (Join-Path $root "package.json"))) {
    throw "package.json was not found. Run this script from the Next.js project root."
}

Backup-File "components\IntegratedHomePage.tsx"
Backup-File "app\ellipsus-home.css"
Backup-File "content\workshopNotices.ts"
Backup-File "components\WorkshopNoticeSlider.tsx"

# -------------------------------------------------------------------
# 1. Workshop notice data file
# -------------------------------------------------------------------

$workshopNoticeData = @'
export type WorkshopNotice = {
  id: string;
  title: string;
  summary: string;
  date: string;
  venue: string;
  poster?: string;
  href?: string;
  badge?: string;
};

export const workshopNotices: WorkshopNotice[] = [
  {
    id: "workshop-01",
    title: "Upcoming LexData workshop",
    summary: "Add the workshop title, schedule, venue, registration link, and poster here.",
    date: "Coming soon",
    venue: "LexData",
    poster: "",
    href: "",
    badge: "NEW WORKSHOP",
  },
  {
    id: "workshop-02",
    title: "Research methods training",
    summary: "Use this card for a new training session, seminar, or academic workshop notice.",
    date: "Coming soon",
    venue: "Online or on site",
    poster: "",
    href: "",
    badge: "NOTICE",
  },
  {
    id: "workshop-03",
    title: "Language and AI workshop",
    summary: "Upload a poster to public/workshop-posters and add its path in this file.",
    date: "Coming soon",
    venue: "LexData",
    poster: "",
    href: "",
    badge: "UPCOMING",
  },
];
'@

Write-Utf8File (Join-Path $root "content\workshopNotices.ts") $workshopNoticeData

# -------------------------------------------------------------------
# 2. Slidable workshop notice component
# -------------------------------------------------------------------

$workshopSliderComponent = @'
"use client";

import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { WorkshopNotice } from "@/content/workshopNotices";

type WorkshopNoticeSliderProps = {
  notices: WorkshopNotice[];
};

export default function WorkshopNoticeSlider({
  notices,
}: WorkshopNoticeSliderProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (nextIndex: number) => {
    const viewport = viewportRef.current;
    if (!viewport || notices.length === 0) return;

    const index = (nextIndex + notices.length) % notices.length;
    const slides = viewport.querySelectorAll<HTMLElement>("[data-workshop-slide]");
    const target = slides[index];

    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    setActiveIndex(index);
  };

  const syncActiveIndex = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const slides = Array.from(
      viewport.querySelectorAll<HTMLElement>("[data-workshop-slide]")
    );

    const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    dragState.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: viewport.scrollLeft,
      moved: false,
    };

    viewport.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || !dragState.current.active) return;

    const distance = event.clientX - dragState.current.startX;

    if (Math.abs(distance) > 5) {
      dragState.current.moved = true;
    }

    viewport.scrollLeft = dragState.current.scrollLeft - distance;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    dragState.current.active = false;

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    syncActiveIndex();
  };

  if (notices.length === 0) {
    return null;
  }

  return (
    <section className="lx-workshop-notice-section" id="workshops">
      <div className="lx-workshop-notice-head">
        <div>
          <p>WORKSHOPS AND NOTICES</p>
          <h2>New sessions, new posters, new opportunities.</h2>
        </div>
        <p className="lx-workshop-notice-copy">
          Upload workshop posters and keep this section updated with your newest
          training sessions, seminars, and registration notices.
        </p>
      </div>

      <div className="lx-workshop-slider-shell">
        <button
          type="button"
          className="lx-workshop-arrow lx-workshop-arrow-left"
          aria-label="Previous workshop notice"
          onClick={() => scrollToIndex(activeIndex - 1)}
        >
          <span aria-hidden="true">&larr;</span>
        </button>

        <div
          ref={viewportRef}
          className="lx-workshop-slider-viewport"
          onScroll={syncActiveIndex}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="lx-workshop-slider-track">
            {notices.map((notice, index) => {
              const card = (
                <article
                  className={`lx-workshop-poster-card ${
                    index === activeIndex ? "is-active" : ""
                  }`}
                >
                  <div className="lx-workshop-poster-frame">
                    {notice.poster ? (
                      <img
                        src={notice.poster}
                        alt={`${notice.title} poster`}
                        draggable={false}
                      />
                    ) : (
                      <div className="lx-workshop-poster-placeholder">
                        <span>POSTER</span>
                        <strong>Upload your workshop poster</strong>
                        <small>public/workshop-posters</small>
                      </div>
                    )}

                    <span className="lx-workshop-badge">
                      {notice.badge || "WORKSHOP"}
                    </span>
                  </div>

                  <div className="lx-workshop-card-copy">
                    <div className="lx-workshop-card-meta">
                      <span>{notice.date}</span>
                      <span>{notice.venue}</span>
                    </div>

                    <h3>{notice.title}</h3>
                    <p>{notice.summary}</p>

                    <span className="lx-workshop-card-action">
                      {notice.href ? "View details" : "Poster notice"}
                      <span aria-hidden="true">&rarr;</span>
                    </span>
                  </div>
                </article>
              );

              return (
                <div
                  key={notice.id}
                  className="lx-workshop-slide"
                  data-workshop-slide
                >
                  {notice.href ? (
                    <a
                      href={notice.href}
                      className="lx-workshop-card-link"
                      onClick={(event) => {
                        if (dragState.current.moved) {
                          event.preventDefault();
                        }
                      }}
                    >
                      {card}
                    </a>
                  ) : (
                    card
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="lx-workshop-arrow lx-workshop-arrow-right"
          aria-label="Next workshop notice"
          onClick={() => scrollToIndex(activeIndex + 1)}
        >
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>

      <div className="lx-workshop-slider-footer">
        <div className="lx-workshop-dots" aria-label="Workshop notice navigation">
          {notices.map((notice, index) => (
            <button
              key={notice.id}
              type="button"
              className={index === activeIndex ? "is-active" : ""}
              aria-label={`Open workshop notice ${index + 1}`}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>

        <span>
          {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(notices.length).padStart(2, "0")}
        </span>
      </div>
    </section>
  );
}
'@

Write-Utf8File (Join-Path $root "components\WorkshopNoticeSlider.tsx") $workshopSliderComponent

# -------------------------------------------------------------------
# 3. Replace homepage TeamShowcase with the workshop slider
# -------------------------------------------------------------------

$homePath = Join-Path $root "components\IntegratedHomePage.tsx"

if (!(Test-Path $homePath)) {
    throw "components\IntegratedHomePage.tsx was not found."
}

$homePageContent = [System.IO.File]::ReadAllText($homePath)

# Replace the TeamShowcase import when present.
$homePageContent = [regex]::Replace(
    $homePageContent,
    'import\s+TeamShowcase\s+from\s+["'']@/components/TeamShowcase["''];?\r?\n',
    'import WorkshopNoticeSlider from "@/components/WorkshopNoticeSlider";' + "`r`n" +
    'import { workshopNotices } from "@/content/workshopNotices";' + "`r`n"
)

# If TeamShowcase was already removed by another patch, insert the new imports after LatestWorkshopVideos.
if ($homePageContent -notmatch 'WorkshopNoticeSlider') {
    $homePageContent = $homePageContent.Replace(
        'import LatestWorkshopVideos from "@/components/LatestWorkshopVideos";',
        'import LatestWorkshopVideos from "@/components/LatestWorkshopVideos";' + "`r`n" +
        'import WorkshopNoticeSlider from "@/components/WorkshopNoticeSlider";' + "`r`n" +
        'import { workshopNotices } from "@/content/workshopNotices";'
    )
}

# Replace the old static team section on the homepage.
$homePageContent = $homePageContent.Replace(
    '<TeamShowcase />',
    '<WorkshopNoticeSlider notices={workshopNotices} />'
)

# If a previous patch left a TeamShowcase import behind, remove it.
$homePageContent = [regex]::Replace(
    $homePageContent,
    'import\s+TeamShowcase\s+from\s+["'']@/components/TeamShowcase["''];?\r?\n',
    ''
)

# Update the final CTA so it no longer points to the removed homepage team section.
$homePageContent = $homePageContent.Replace(
    '<Link href="/about" className="lx-final-link">Meet the people behind LexData</Link>',
    '<a href="#workshops" className="lx-final-link">Explore upcoming workshops</a>'
)

Write-Utf8File $homePath $homePageContent

# -------------------------------------------------------------------
# 4. Add Ellipsus-style workshop slider CSS
# -------------------------------------------------------------------

$cssPath = Join-Path $root "app\ellipsus-home.css"

if (!(Test-Path $cssPath)) {
    throw "app\ellipsus-home.css was not found."
}

$css = [System.IO.File]::ReadAllText($cssPath)
$marker = "/* LEXDATA WORKSHOP NOTICE SLIDER V7 */"

if ($css -notmatch [regex]::Escape($marker)) {
    $workshopCss = @'

/* LEXDATA WORKSHOP NOTICE SLIDER V7 */
.lx-workshop-notice-section {
  position: relative;
  overflow: hidden;
  padding: clamp(72px, 8vw, 128px) 0 clamp(76px, 8vw, 132px);
  background: #050505;
  color: #f7f5f0;
}

.lx-workshop-notice-section::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 12% 14%, rgba(255,255,255,.055), transparent 22%),
    radial-gradient(circle at 86% 20%, rgba(255,255,255,.04), transparent 20%);
}

.lx-workshop-notice-head {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr);
  gap: clamp(28px, 6vw, 100px);
  align-items: end;
  width: min(1450px, calc(100% - 64px));
  margin: 0 auto clamp(42px, 5vw, 78px);
}

.lx-workshop-notice-head > div > p {
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .22em;
  color: rgba(255,255,255,.58);
}

.lx-workshop-notice-head h2 {
  max-width: 900px;
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(42px, 5.4vw, 88px);
  font-weight: 400;
  line-height: .94;
  letter-spacing: -.045em;
}

.lx-workshop-notice-copy {
  max-width: 540px;
  margin: 0;
  font-size: clamp(16px, 1.35vw, 21px);
  font-weight: 300;
  line-height: 1.55;
  color: rgba(255,255,255,.7);
}

.lx-workshop-slider-shell {
  position: relative;
  width: 100%;
}

.lx-workshop-slider-viewport {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
  touch-action: pan-x;
  user-select: none;
}

.lx-workshop-slider-viewport:active {
  cursor: grabbing;
}

.lx-workshop-slider-viewport::-webkit-scrollbar {
  display: none;
}

.lx-workshop-slider-track {
  display: flex;
  align-items: stretch;
  gap: clamp(22px, 2.4vw, 42px);
  width: max-content;
  padding: 0 clamp(9vw, 13vw, 17vw);
}

.lx-workshop-slide {
  flex: 0 0 min(72vw, 980px);
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

.lx-workshop-card-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.lx-workshop-poster-card {
  display: grid;
  grid-template-columns: minmax(280px, .92fr) minmax(300px, 1.08fr);
  min-height: 520px;
  overflow: hidden;
  border-radius: 30px;
  background: #267bc2;
  opacity: .6;
  transform: scale(.94);
  transition:
    opacity .35s ease,
    transform .35s ease,
    box-shadow .35s ease;
}

.lx-workshop-poster-card.is-active {
  opacity: 1;
  transform: scale(1);
  box-shadow: 0 32px 90px rgba(0,0,0,.34);
}

.lx-workshop-poster-frame {
  position: relative;
  min-height: 520px;
  margin: 24px 0 24px 24px;
  overflow: hidden;
  border-radius: 20px;
  background: #f7f5f0;
}

.lx-workshop-poster-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.lx-workshop-poster-placeholder {
  display: flex;
  min-height: 100%;
  height: 100%;
  padding: 42px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  color: #121212;
  background:
    linear-gradient(145deg, rgba(39,123,194,.1), transparent 48%),
    #f7f5f0;
}

.lx-workshop-poster-placeholder span {
  margin-bottom: 22px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .24em;
  color: #267bc2;
}

.lx-workshop-poster-placeholder strong {
  max-width: 360px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(32px, 3vw, 52px);
  font-weight: 400;
  line-height: 1;
}

.lx-workshop-poster-placeholder small {
  margin-top: 24px;
  font-size: 13px;
  color: rgba(18,18,18,.56);
}

.lx-workshop-badge {
  position: absolute;
  top: 22px;
  left: 22px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,.14);
  background: rgba(247,245,240,.92);
  color: #111;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .16em;
  backdrop-filter: blur(10px);
}

.lx-workshop-card-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(38px, 5vw, 76px);
  color: #fff;
}

.lx-workshop-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  margin-bottom: 26px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255,255,255,.68);
}

.lx-workshop-card-copy h3 {
  max-width: 600px;
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(38px, 4.2vw, 68px);
  font-weight: 400;
  line-height: .98;
  letter-spacing: -.035em;
}

.lx-workshop-card-copy p {
  max-width: 580px;
  margin: 26px 0 0;
  font-size: clamp(15px, 1.35vw, 20px);
  font-weight: 300;
  line-height: 1.5;
  color: rgba(255,255,255,.82);
}

.lx-workshop-card-action {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  margin-top: 36px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.lx-workshop-card-action span {
  font-size: 24px;
  font-weight: 300;
  transition: transform .25s ease;
}

.lx-workshop-card-link:hover .lx-workshop-card-action span {
  transform: translateX(7px);
}

.lx-workshop-arrow {
  position: absolute;
  z-index: 8;
  top: 50%;
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  padding: 0;
  border: 1px solid rgba(255,255,255,.55);
  border-radius: 50%;
  background: rgba(0,0,0,.24);
  color: #fff;
  transform: translateY(-50%);
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition:
    background .2s ease,
    transform .2s ease;
}

.lx-workshop-arrow:hover {
  background: rgba(0,0,0,.62);
  transform: translateY(-50%) scale(1.04);
}

.lx-workshop-arrow span {
  font-size: 35px;
  font-weight: 200;
  line-height: 1;
}

.lx-workshop-arrow-left {
  left: max(24px, 6vw);
}

.lx-workshop-arrow-right {
  right: max(24px, 6vw);
}

.lx-workshop-slider-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(1450px, calc(100% - 64px));
  margin: 34px auto 0;
  color: rgba(255,255,255,.52);
  font-size: 12px;
  letter-spacing: .15em;
}

.lx-workshop-dots {
  display: flex;
  gap: 9px;
}

.lx-workshop-dots button {
  width: 34px;
  height: 3px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255,255,255,.22);
  cursor: pointer;
  transition:
    width .25s ease,
    background .25s ease;
}

.lx-workshop-dots button.is-active {
  width: 70px;
  background: #fff;
}

@media (max-width: 900px) {
  .lx-workshop-notice-head {
    grid-template-columns: 1fr;
    width: min(100% - 36px, 760px);
  }

  .lx-workshop-slide {
    flex-basis: min(86vw, 680px);
  }

  .lx-workshop-poster-card {
    grid-template-columns: 1fr;
  }

  .lx-workshop-poster-frame {
    min-height: 460px;
    margin: 16px 16px 0;
  }

  .lx-workshop-card-copy {
    padding: 34px 28px 42px;
  }

  .lx-workshop-arrow {
    width: 58px;
    height: 58px;
  }

  .lx-workshop-slider-footer {
    width: calc(100% - 36px);
  }
}

@media (max-width: 640px) {
  .lx-workshop-notice-section {
    padding-top: 64px;
  }

  .lx-workshop-slider-track {
    gap: 16px;
    padding: 0 7vw;
  }

  .lx-workshop-slide {
    flex-basis: 86vw;
  }

  .lx-workshop-poster-frame {
    min-height: 390px;
  }

  .lx-workshop-arrow {
    top: auto;
    bottom: -4px;
    width: 48px;
    height: 48px;
  }

  .lx-workshop-arrow-left {
    left: 20px;
  }

  .lx-workshop-arrow-right {
    right: 20px;
  }

  .lx-workshop-slider-footer {
    justify-content: center;
    padding: 0 60px;
  }

  .lx-workshop-slider-footer > span {
    display: none;
  }
}
'@

    $css = $css + $workshopCss
    Write-Utf8File $cssPath $css
}

# -------------------------------------------------------------------
# 5. Create poster upload folder and instructions
# -------------------------------------------------------------------

$posterDir = Join-Path $root "public\workshop-posters"
New-Item -ItemType Directory -Path $posterDir -Force | Out-Null

$posterReadme = @'
WORKSHOP POSTER UPLOADS

1. Put poster images in this folder:
   public/workshop-posters

2. Recommended formats:
   .jpg
   .jpeg
   .png
   .webp

3. Example file:
   public/workshop-posters/ssci-workshop-july.jpg

4. Then edit:
   content/workshopNotices.ts

5. Set the poster field like this:
   poster: "/workshop-posters/ssci-workshop-july.jpg",

6. Add as many workshop notice objects as you need.
   The homepage slider automatically uses every item in workshopNotices.
'@

Write-Utf8File (Join-Path $posterDir "README.txt") $posterReadme

# -------------------------------------------------------------------
# 6. Remove stale in-project backup folders that can break TypeScript
# -------------------------------------------------------------------

Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Name -like "_ellipsus_art_backup_*" -or
        $_.Name -like "_lexdata_*_backup_*"
    } |
    ForEach-Object {
        $safeDest = Join-Path $parent ("archived_" + $_.Name + "_" + $stamp)
        Move-Item $_.FullName $safeDest -Force
        Write-Host "Moved old backup outside project: $($_.Name)" -ForegroundColor Yellow
    }

# -------------------------------------------------------------------
# 7. Clear Next.js cache
# -------------------------------------------------------------------

$nextDir = Join-Path $root ".next"
if (Test-Path $nextDir) {
    Remove-Item -Recurse -Force $nextDir
}

Write-Host ""
Write-Host "V7 applied successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Changed:" -ForegroundColor Cyan
Write-Host "  - Removed the homepage TeamShowcase section."
Write-Host "  - Added a draggable/swipeable workshop notice poster slider."
Write-Host "  - Added content/workshopNotices.ts."
Write-Host "  - Added public/workshop-posters for poster uploads."
Write-Host "  - Added Ellipsus-style poster cards and slider arrows."
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "  npm.cmd run build"
Write-Host "  npm.cmd run dev"

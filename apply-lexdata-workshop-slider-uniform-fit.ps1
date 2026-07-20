$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$parent = Split-Path $root -Parent
$backupRoot = Join-Path $parent ("lexdata_workshop_slider_uniform_backup_" + $stamp)

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

Write-Host "LexData workshop slider uniform sizing + clickable details fix" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

Backup-File "components\WorkshopNoticeSlider.tsx"
Backup-File "app\ellipsus-home.css"

# -------------------------------------------------------------------
# 1. Replace WorkshopNoticeSlider:
#    - poster area always same dimensions
#    - image uses object-fit: contain so full poster remains visible
#    - title/summary have fixed visual heights
#    - View details is a real clickable link
#    - only the View details button navigates; card itself stays draggable
# -------------------------------------------------------------------

$sliderTsx = @'
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
    const slides =
      viewport.querySelectorAll<HTMLElement>("[data-workshop-slide]");
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
            {notices.map((notice, index) => (
              <div
                key={notice.id}
                className="lx-workshop-slide"
                data-workshop-slide
              >
                <article
                  className={`lx-workshop-poster-card ${
                    index === activeIndex ? "is-active" : ""
                  }`}
                >
                  <div className="lx-workshop-poster-frame">
                    <div className="lx-workshop-poster-media">
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
                          <small>Manage this poster from the Admin Control Panel</small>
                        </div>
                      )}
                    </div>

                    <span className="lx-workshop-badge">
                      {notice.badge || "WORKSHOP"}
                    </span>
                  </div>

                  <div className="lx-workshop-card-copy">
                    <div className="lx-workshop-card-meta">
                      <span>{notice.date || "Coming soon"}</span>
                      <span>{notice.venue || "LexData"}</span>
                    </div>

                    <h3 title={notice.title}>{notice.title}</h3>

                    <p title={notice.summary}>{notice.summary}</p>

                    <div className="lx-workshop-card-action-row">
                      {notice.href ? (
                        <a
                          href={notice.href}
                          className="lx-workshop-card-action lx-workshop-details-link"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          <span>View details</span>
                          <span aria-hidden="true">&rarr;</span>
                        </a>
                      ) : (
                        <span className="lx-workshop-card-action lx-workshop-card-action-disabled">
                          <span>Poster notice</span>
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </div>
            ))}
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
        <div
          className="lx-workshop-dots"
          aria-label="Workshop notice navigation"
        >
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

Write-Utf8 (Join-Path $root "components\WorkshopNoticeSlider.tsx") $sliderTsx

# -------------------------------------------------------------------
# 2. Append strict uniform sizing overrides
# -------------------------------------------------------------------

$cssPath = Join-Path $root "app\ellipsus-home.css"
$cssContent = [System.IO.File]::ReadAllText($cssPath)
$marker = "/* LEXDATA WORKSHOP SLIDER UNIFORM FIT V8 */"

if (-not $cssContent.Contains($marker)) {
    $css = @'

/* LEXDATA WORKSHOP SLIDER UNIFORM FIT V8 */

/*
  Every slide uses the same outer height and the same poster viewport.
  Posters are contained, not cropped, so portrait, square, and landscape
  uploads all remain fully visible inside an identical frame.
*/
.lx-workshop-poster-card {
  height: 620px !important;
  min-height: 620px !important;
  grid-template-columns: minmax(0, 46%) minmax(0, 54%) !important;
}

.lx-workshop-poster-frame {
  height: calc(100% - 48px) !important;
  min-height: 0 !important;
  margin: 24px 0 24px 24px !important;
  background: #f7f5f0 !important;
}

.lx-workshop-poster-media {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #f7f5f0;
}

.lx-workshop-poster-media img,
.lx-workshop-poster-frame img {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  object-position: center center !important;
  display: block;
  background: #f7f5f0;
  pointer-events: none;
}

.lx-workshop-poster-placeholder {
  box-sizing: border-box;
  width: 100%;
  height: 100% !important;
  min-height: 0 !important;
}

/*
  Fixed text areas keep every card visually aligned even when one title
  or description is much longer than another.
*/
.lx-workshop-card-copy {
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
  justify-content: center !important;
  overflow: hidden;
}

.lx-workshop-card-meta {
  min-height: 38px;
  align-content: flex-start;
}

.lx-workshop-card-copy h3 {
  display: -webkit-box;
  min-height: 3.02em;
  max-height: 3.02em;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  font-size: clamp(38px, 3.8vw, 64px) !important;
  line-height: 1.01 !important;
}

.lx-workshop-card-copy p {
  display: -webkit-box;
  min-height: 4.5em;
  max-height: 4.5em;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.lx-workshop-card-action-row {
  min-height: 58px;
  display: flex;
  align-items: flex-end;
  margin-top: 24px;
}

.lx-workshop-card-action {
  margin-top: 0 !important;
}

/*
  View details is now a dedicated clickable control instead of wrapping the
  entire draggable slide. This avoids drag/swipe handling swallowing the link.
*/
.lx-workshop-details-link {
  position: relative;
  z-index: 20;
  display: inline-flex !important;
  width: fit-content;
  align-items: center;
  gap: 14px;
  padding: 13px 18px;
  border: 1px solid rgba(255,255,255,.55);
  border-radius: 999px;
  color: #fff !important;
  text-decoration: none !important;
  cursor: pointer !important;
  pointer-events: auto !important;
  background: rgba(0,0,0,.12);
  transition:
    background .2s ease,
    transform .2s ease,
    border-color .2s ease;
}

.lx-workshop-details-link:hover {
  background: rgba(0,0,0,.28);
  border-color: rgba(255,255,255,.9);
  transform: translateY(-2px);
}

.lx-workshop-details-link > span:last-child {
  transition: transform .2s ease;
}

.lx-workshop-details-link:hover > span:last-child {
  transform: translateX(5px);
}

.lx-workshop-card-action-disabled {
  opacity: .6;
  cursor: default;
  pointer-events: none;
}

@media (max-width: 900px) {
  .lx-workshop-poster-card {
    height: auto !important;
    min-height: 0 !important;
    grid-template-columns: 1fr !important;
  }

  .lx-workshop-poster-frame {
    height: 520px !important;
    margin: 16px 16px 0 !important;
  }

  .lx-workshop-card-copy {
    height: auto;
  }

  .lx-workshop-card-copy h3 {
    min-height: 2.05em;
    max-height: 2.05em;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}

@media (max-width: 640px) {
  .lx-workshop-poster-frame {
    height: 430px !important;
  }

  .lx-workshop-card-copy h3 {
    font-size: clamp(34px, 10vw, 48px) !important;
  }
}
'@

    $cssContent = $cssContent + $css
    Write-Utf8 $cssPath $cssContent
}

Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Workshop slider uniform sizing fix applied." -ForegroundColor Green
Write-Host ""
Write-Host "Changes:" -ForegroundColor Cyan
Write-Host "  - Every desktop poster card is the same height."
Write-Host "  - Every poster viewport is the same size."
Write-Host "  - Poster images use object-fit: contain, so the complete poster is visible."
Write-Host "  - Titles are capped at 3 lines."
Write-Host "  - Summaries are capped at 3 lines."
Write-Host "  - View details is now a dedicated clickable link."
Write-Host "  - Slides remain draggable/swipeable."
Write-Host ""
Write-Host "Run:" -ForegroundColor Cyan
Write-Host "  npm.cmd run build"

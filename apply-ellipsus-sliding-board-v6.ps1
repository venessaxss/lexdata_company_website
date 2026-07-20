$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = (Get-Location).Path
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$parent = Split-Path $root -Parent
$backupRoot = Join-Path $parent ("lexdata_slider_backup_" + $stamp)
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
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        Copy-Item $src $dest -Force
    }
}

Backup-File "components\IntegratedHomePage.tsx"
Backup-File "app\ellipsus-home.css"

$sliderComponent = @'
"use client";

import React, { Children, ReactNode, useMemo, useRef, useState } from "react";

type DashboardBoardSliderProps = {
  children: ReactNode;
  labels?: string[];
};

export default function DashboardBoardSlider({
  children,
  labels = ["Workspace", "Notifications", "Video"],
}: DashboardBoardSliderProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const slides = useMemo(() => Children.toArray(children), [children]);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (nextIndex: number) => {
    if (!viewportRef.current || slides.length === 0) return;

    const index = (nextIndex + slides.length) % slides.length;
    const items = viewportRef.current.querySelectorAll<HTMLElement>("[data-board-slide]");
    const target = items[index];

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      setActiveIndex(index);
    }
  };

  const syncActiveSlide = () => {
    if (!viewportRef.current) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
      const items = Array.from(viewport.querySelectorAll<HTMLElement>("[data-board-slide]"));

      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      items.forEach((item, index) => {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const distance = Math.abs(itemCenter - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    });
  };

  return (
    <div className="lx-board-slider-shell">
      <button
        type="button"
        className="lx-board-arrow lx-board-arrow-left"
        aria-label="Previous board"
        onClick={() => scrollToIndex(activeIndex - 1)}
      >
        <span aria-hidden="true">&larr;</span>
      </button>

      <div
        ref={viewportRef}
        className="lx-board-slider-viewport"
        onScroll={syncActiveSlide}
      >
        <div className="lx-board-slider-track">
          {slides.map((slide, index) => (
            <article
              key={index}
              className={`lx-board-slide ${index === activeIndex ? "is-active" : ""}`}
              data-board-slide
              aria-label={labels[index] || `Board ${index + 1}`}
            >
              <div className="lx-board-slide-inner">{slide}</div>
              <div className="lx-board-slide-label">{labels[index] || `Board ${index + 1}`}</div>
            </article>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="lx-board-arrow lx-board-arrow-right"
        aria-label="Next board"
        onClick={() => scrollToIndex(activeIndex + 1)}
      >
        <span aria-hidden="true">&rarr;</span>
      </button>

      <div className="lx-board-dots" aria-label="Board navigation">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            className={index === activeIndex ? "is-active" : ""}
            aria-label={`Open ${labels[index] || `board ${index + 1}`}`}
            onClick={() => scrollToIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
'@

Write-Utf8File (Join-Path $root "components\DashboardBoardSlider.tsx") $sliderComponent

$homePath = Join-Path $root "components\IntegratedHomePage.tsx"
if (!(Test-Path $homePath)) {
    throw "components\IntegratedHomePage.tsx was not found. Run this script from the project root."
}

$home = [System.IO.File]::ReadAllText($homePath)

if ($home -notmatch 'DashboardBoardSlider') {
    $home = $home.Replace(
        'import DynamicHomeShowcase from "@/components/DynamicHomeShowcase";',
        "import DynamicHomeShowcase from `"@/components/DynamicHomeShowcase`";`r`nimport DashboardBoardSlider from `"@/components/DashboardBoardSlider`";"
    )
}

$oldStage = @'
        <div className="lx-dashboard-stage">
          <div className="lx-dashboard-side lx-dashboard-side-left" aria-hidden="true"><i /><i /></div>
          <div className="lx-dashboard-main"><DynamicHomeShowcase /></div>
          <div className="lx-dashboard-side lx-dashboard-side-right" aria-hidden="true"><i /><i /></div>
        </div>
'@

$newStage = @'
        <div className="lx-dashboard-stage lx-dashboard-stage-sliding">
          <DashboardBoardSlider labels={["Workspace", "Notifications", "Video"]}>
            <div className="lx-dashboard-main lx-dashboard-main-slide"><DynamicHomeShowcase /></div>
            <div className="lx-dashboard-main lx-dashboard-main-slide lx-dashboard-notice-slide"><NoticeSpotlight /></div>
            <div className="lx-dashboard-main lx-dashboard-main-slide lx-dashboard-video-slide"><HomeVideoSpotlight /></div>
          </DashboardBoardSlider>
        </div>
'@

if ($home.Contains($oldStage)) {
    $home = $home.Replace($oldStage, $newStage)
} elseif ($home -notmatch 'lx-dashboard-stage-sliding') {
    $pattern = '(?s)\s*<div className="lx-dashboard-stage">.*?</div>\s*<div className="lx-dashboard-caption">'
    $replacement = "`r`n" + $newStage + '        <div className="lx-dashboard-caption">'
    $home = [regex]::Replace($home, $pattern, $replacement, 1)
}

Write-Utf8File $homePath $home

$cssPath = Join-Path $root "app\ellipsus-home.css"
if (!(Test-Path $cssPath)) {
    throw "app\ellipsus-home.css was not found."
}

$css = [System.IO.File]::ReadAllText($cssPath)
$marker = "/* ELLIPSUS SLIDING DASHBOARD V6 */"

if ($css -notmatch [regex]::Escape($marker)) {
    $sliderCss = @'

/* ELLIPSUS SLIDING DASHBOARD V6 */
.lx-dashboard-stage-sliding {
  display: block;
  width: 100%;
  overflow: visible;
  padding: 0;
}

.lx-board-slider-shell {
  position: relative;
  width: 100%;
  padding: 0 0 26px;
}

.lx-board-slider-viewport {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
  touch-action: pan-x;
}

.lx-board-slider-viewport:active {
  cursor: grabbing;
}

.lx-board-slider-viewport::-webkit-scrollbar {
  display: none;
}

.lx-board-slider-track {
  display: flex;
  align-items: stretch;
  gap: clamp(22px, 2.5vw, 48px);
  width: max-content;
  padding: 0 clamp(11vw, 14vw, 18vw);
}

.lx-board-slide {
  position: relative;
  flex: 0 0 min(74vw, 980px);
  min-height: 430px;
  scroll-snap-align: center;
  scroll-snap-stop: always;
  border-radius: 28px;
  background: #287ac1;
  overflow: hidden;
  opacity: .72;
  transform: scale(.94);
  transition: transform .35s ease, opacity .35s ease, box-shadow .35s ease;
}

.lx-board-slide.is-active {
  opacity: 1;
  transform: scale(1);
  box-shadow: 0 22px 50px rgba(0, 0, 0, .18);
}

.lx-board-slide-inner {
  min-height: 430px;
  padding: clamp(14px, 2vw, 26px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lx-dashboard-main-slide {
  width: 100%;
  min-height: 390px;
  padding: 0;
  border-radius: 18px;
  overflow: hidden;
}

.lx-dashboard-main-slide > * {
  width: 100%;
}

.lx-dashboard-notice-slide,
.lx-dashboard-video-slide {
  background: rgba(255, 255, 255, .97);
  color: #111;
}

.lx-board-slide-label {
  position: absolute;
  left: 20px;
  bottom: 18px;
  z-index: 4;
  padding: 8px 13px;
  border: 1px solid rgba(255, 255, 255, .45);
  border-radius: 999px;
  background: rgba(0, 0, 0, .72);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .04em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}

.lx-board-arrow {
  position: absolute;
  top: 50%;
  z-index: 12;
  width: 82px;
  height: 82px;
  margin-top: -54px;
  border: 1.5px solid rgba(255, 255, 255, .9);
  border-radius: 50%;
  background: rgba(0, 0, 0, .18);
  color: #fff;
  font-size: 42px;
  font-weight: 200;
  line-height: 1;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background .2s ease, transform .2s ease;
}

.lx-board-arrow:hover {
  background: rgba(0, 0, 0, .55);
  transform: scale(1.04);
}

.lx-board-arrow-left {
  left: max(18px, calc(50% - min(37vw, 490px) - 44px));
}

.lx-board-arrow-right {
  right: max(18px, calc(50% - min(37vw, 490px) - 44px));
}

.lx-board-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
}

.lx-board-dots button {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .38);
  cursor: pointer;
  transition: width .2s ease, border-radius .2s ease, background .2s ease;
}

.lx-board-dots button.is-active {
  width: 30px;
  border-radius: 999px;
  background: #fff;
}

@media (max-width: 900px) {
  .lx-board-slider-track {
    padding-inline: 7vw;
    gap: 18px;
  }

  .lx-board-slide {
    flex-basis: 86vw;
    min-height: 360px;
  }

  .lx-board-slide-inner,
  .lx-dashboard-main-slide {
    min-height: 330px;
  }

  .lx-board-arrow {
    width: 58px;
    height: 58px;
    margin-top: -42px;
    font-size: 30px;
  }

  .lx-board-arrow-left { left: 10px; }
  .lx-board-arrow-right { right: 10px; }
}
'@

    $css = $css + $sliderCss
    Write-Utf8File $cssPath $css
}

Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue

Write-Host "Sliding dashboard board applied successfully." -ForegroundColor Green
Write-Host "You can now drag/swipe the board horizontally, use the arrows, or click the navigation dots." -ForegroundColor Cyan
Write-Host "Backup saved outside the project at: $backupRoot" -ForegroundColor DarkGray
Write-Host "Next: npm.cmd run build" -ForegroundColor Yellow

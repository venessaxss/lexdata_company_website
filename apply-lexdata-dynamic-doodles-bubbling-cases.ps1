$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupRoot = Join-Path (Split-Path $root -Parent) ("lexdata_dynamic_doodles_backup_" + $stamp)
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

function Backup-File([string]$RelativePath) {
    $src = Join-Path $root $RelativePath
    if (Test-Path $src) {
        $dst = Join-Path $backupRoot $RelativePath
        $dir = Split-Path $dst -Parent
        if ($dir) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Copy-Item $src $dst -Force
    }
}

function Write-Utf8([string]$Path, [string]$Content) {
    $dir = Split-Path $Path -Parent
    if ($dir -and !(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

if (!(Test-Path (Join-Path $root "package.json"))) {
    throw "Run this script from the LexData Next.js project root."
}

Backup-File "components\IntegratedHomePage.tsx"
Backup-File "components\DynamicDoodleBand.tsx"
Backup-File "components\BubblingCaseGrid.tsx"
Backup-File "app\ellipsus-home.css"

$doodleBand = @'
"use client";

import { useEffect, useRef } from "react";

export default function DynamicDoodleBand() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const move = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      root.style.setProperty("--doodle-x", String(x));
      root.style.setProperty("--doodle-y", String(y));
    };

    const leave = () => {
      root.style.setProperty("--doodle-x", "0");
      root.style.setProperty("--doodle-y", "0");
    };

    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={rootRef} className="lx-doodle-band">
      <div className="lx-doodle-collab" aria-hidden="true">
        <div className="lx-avatar-stack">
          <span>R</span><span>L</span><span>D</span>
        </div>
        <svg className="lx-collab-arrow" viewBox="0 0 150 70" fill="none">
          <path d="M138 50C108 20 61 18 17 32" />
          <path d="M29 20 15 32l16 9" />
        </svg>
        <p>That is us, collaborating.</p>
      </div>

      <div className="lx-doodle-copy">
        <p>One connected workspace</p>
        <h2>Dashboards, drafts, cases, and discussions</h2>
        <span>
          Keep serious research organized without making the interface feel corporate.
          Move from research to review to feedback in one visual flow.
        </span>
      </div>

      <div className="lx-doodle-object lx-doodle-books-cup" aria-hidden="true">
        <svg viewBox="0 0 290 240" fill="none">
          <path d="M37 190h164" />
          <path d="M55 169h130v21H55z" />
          <path d="M67 145h111v24H67z" />
          <path d="M81 120h89v25H81z" />
          <path d="M98 62v53" />
          <path d="M98 75h53v47H98z" />
          <path d="M151 83c24 0 28 31 3 33" />
          <path d="M119 50c-6-14 7-20 1-33" />
        </svg>
      </div>

      <div className="lx-doodle-object lx-doodle-lamp-plant" aria-hidden="true">
        <svg viewBox="0 0 340 300" fill="none">
          <path d="M238 54 290 25l26 45-50 30z" />
          <path d="m275 94-44 87" />
          <path d="M230 180h53" />
          <path d="M255 181v64" />
          <path d="M225 245h64" />
          <path d="M59 223h95" />
          <path d="M78 223l-9-57h72l-8 57" />
          <path d="M95 166c-32-19-28-58 4-57 24 1 31 30 16 50" />
          <path d="M113 166c28-23 48-6 40 17-5 17-22 28-35 29" />
          <path d="M107 165c-2-38 22-55 41-36 15 15 2 36-20 49" />
        </svg>
      </div>
    </div>
  );
}
'@
Write-Utf8 (Join-Path $root "components\DynamicDoodleBand.tsx") $doodleBand

$bubblingCases = @'
"use client";

import { useEffect, useRef } from "react";

const caseCards = [
  { label: "Case 01", title: "Corpus-based research training", body: "From raw text collection to cleaning, annotation, and analysis-ready datasets." },
  { label: "Case 02", title: "Multilingual translation workflow", body: "Human-in-the-loop terminology, translation review, and bilingual quality control." },
  { label: "Case 03", title: "AI research classroom", body: "Generative AI, Python, and NLP turned into practical workshops for humanities researchers." },
];

export default function BubblingCaseGrid() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-bubble-card]"));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) (entry.target as HTMLElement).classList.add("is-visible");
      }),
      { threshold: 0.18 }
    );

    cards.forEach((card) => observer.observe(card));

    const cleanup: Array<() => void> = [];
    cards.forEach((card) => {
      const move = (event: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--card-x", String(x));
        card.style.setProperty("--card-y", String(y));
      };
      const leave = () => {
        card.style.setProperty("--card-x", "0");
        card.style.setProperty("--card-y", "0");
      };
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      cleanup.push(() => {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", leave);
      });
    });

    return () => {
      observer.disconnect();
      cleanup.forEach((dispose) => dispose());
    };
  }, []);

  return (
    <div ref={gridRef} className="lx-case-bubble-stage">
      <div className="lx-case-bubbles" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={index} style={{ "--bubble-i": index } as React.CSSProperties} />
        ))}
      </div>

      <div className="lx-case-grid lx-case-grid-bubbling">
        {caseCards.map((card, index) => (
          <article
            key={card.title}
            className="lx-case-card lx-case-bubble-card"
            data-bubble-card
            style={{ "--case-i": index } as React.CSSProperties}
          >
            <span>{card.label}</span>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            <i className="lx-case-orbit lx-case-orbit-a" aria-hidden="true" />
            <i className="lx-case-orbit lx-case-orbit-b" aria-hidden="true" />
          </article>
        ))}
      </div>
    </div>
  );
}
'@
Write-Utf8 (Join-Path $root "components\BubblingCaseGrid.tsx") $bubblingCases

$homePath = Join-Path $root "components\IntegratedHomePage.tsx"
$homePageContent = [System.IO.File]::ReadAllText($homePath)

if ($homePageContent -notmatch 'DynamicDoodleBand') {
    $homePageContent = $homePageContent.Replace(
        'import DashboardBoardSlider from "@/components/DashboardBoardSlider";',
        'import DashboardBoardSlider from "@/components/DashboardBoardSlider";' + "`r`n" +
        'import DynamicDoodleBand from "@/components/DynamicDoodleBand";'
    )
}

if ($homePageContent -notmatch 'BubblingCaseGrid') {
    $homePageContent = $homePageContent.Replace(
        'import NoticeSpotlight from "@/components/NoticeSpotlight";',
        'import NoticeSpotlight from "@/components/NoticeSpotlight";' + "`r`n" +
        'import BubblingCaseGrid from "@/components/BubblingCaseGrid";'
    )
}

$dashboardPattern = '(?s)\s*<div className="lx-dashboard-intro">.*?</div>\s*<div className="lx-dashboard-stage'
if ([regex]::IsMatch($homePageContent, $dashboardPattern)) {
    $homePageContent = [regex]::Replace(
        $homePageContent,
        $dashboardPattern,
        "`r`n        <DynamicDoodleBand />`r`n        <div className=`"lx-dashboard-stage",
        1
    )
}

$casePattern = '(?s)\s*<div className="lx-case-grid">.*?</div>\s*</section>'
if ([regex]::IsMatch($homePageContent, $casePattern)) {
    $homePageContent = [regex]::Replace(
        $homePageContent,
        $casePattern,
        "`r`n        <BubblingCaseGrid />`r`n      </section>",
        1
    )
}

Write-Utf8 $homePath $homePageContent

$cssPath = Join-Path $root "app\ellipsus-home.css"
$cssContent = [System.IO.File]::ReadAllText($cssPath)
$marker = "/* LEXDATA DYNAMIC DOODLES AND BUBBLING CASES V1 */"

if (-not $cssContent.Contains($marker)) {
$css = @'

/* LEXDATA DYNAMIC DOODLES AND BUBBLING CASES V1 */

.lx-doodle-band {
  --doodle-x: 0;
  --doodle-y: 0;
  position: relative;
  min-height: 650px;
  width: min(1580px, 100%);
  margin: 0 auto 54px;
  overflow: hidden;
  display: grid;
  place-items: center;
  padding: 90px 8vw 100px;
  background: #000;
  color: #fff;
}

.lx-doodle-copy { position: relative; z-index: 5; width: min(980px, 72%); text-align: center; }
.lx-doodle-copy > p { margin: 0 0 18px; font-size: 12px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.62); }
.lx-doodle-copy h2 { margin: 0; font: 500 clamp(56px, 7vw, 112px)/.92 Fraunces, Georgia, serif; letter-spacing: -.055em; }
.lx-doodle-copy > span { display: block; max-width: 760px; margin: 54px auto 0; font-size: clamp(16px, 1.6vw, 23px); line-height: 1.45; color: rgba(255,255,255,.82); }

.lx-doodle-collab {
  position: absolute; z-index: 4; left: 6%; top: 9%; display: flex; align-items: center; gap: 18px;
  transform: translate(calc(var(--doodle-x) * 14px), calc(var(--doodle-y) * 9px));
  transition: transform .18s ease-out;
}
.lx-avatar-stack { display: flex; }
.lx-avatar-stack span { width: 46px; height: 46px; margin-left: -10px; display: grid; place-items: center; border: 2px solid #fff; border-radius: 50%; background: #efede7; color: #111; font: 500 18px/1 Fraunces, Georgia, serif; }
.lx-avatar-stack span:first-child { margin-left: 0; }
.lx-avatar-stack span:nth-child(1) { animation: lxAvatarFloat 4.4s ease-in-out infinite; }
.lx-avatar-stack span:nth-child(2) { animation: lxAvatarFloat 4.4s .35s ease-in-out infinite; }
.lx-avatar-stack span:nth-child(3) { animation: lxAvatarFloat 4.4s .7s ease-in-out infinite; }
@keyframes lxAvatarFloat { 50% { transform: translateY(-7px) rotate(2deg); } }

.lx-collab-arrow { width: 112px; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 260; stroke-dashoffset: 260; animation: lxDrawLine 2.6s ease-in-out infinite alternate; }
@keyframes lxDrawLine { to { stroke-dashoffset: 0; } }
.lx-doodle-collab p { margin: 0; font-size: 18px; color: rgba(255,255,255,.88); }

.lx-doodle-object { position: absolute; z-index: 2; pointer-events: none; opacity: .94; transition: transform .18s ease-out; }
.lx-doodle-object svg { width: 100%; height: 100%; stroke: rgba(255,255,255,.94); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.lx-doodle-books-cup { left: 3%; bottom: 2%; width: 280px; height: 230px; transform: translate(calc(var(--doodle-x) * -20px), calc(var(--doodle-y) * -13px)); animation: lxDoodleBreatheLeft 6.8s ease-in-out infinite; }
.lx-doodle-lamp-plant { right: 2%; bottom: 1%; width: 330px; height: 300px; transform: translate(calc(var(--doodle-x) * 24px), calc(var(--doodle-y) * 15px)); animation: lxDoodleBreatheRight 7.4s .7s ease-in-out infinite; }
@keyframes lxDoodleBreatheLeft { 50% { margin-bottom: 10px; } }
@keyframes lxDoodleBreatheRight { 50% { margin-bottom: 13px; } }

.lx-case-bubble-stage { position: relative; width: min(1420px, 100%); margin: 0 auto; padding: 60px 0 90px; isolation: isolate; }
.lx-case-bubbles { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
.lx-case-bubbles span {
  --bubble-size: calc(22px + ((var(--bubble-i) % 5) * 18px));
  position: absolute; width: var(--bubble-size); height: var(--bubble-size);
  left: calc(4% + ((var(--bubble-i) * 17) % 88) * 1%);
  top: calc(8% + ((var(--bubble-i) * 23) % 78) * 1%);
  border: 1px solid rgba(31,120,200,.22); border-radius: 50%; background: rgba(255,255,255,.4);
  animation: lxBubbleDrift calc(5s + (var(--bubble-i) * .38s)) ease-in-out infinite alternate;
}
.lx-case-bubbles span:nth-child(3n) { border-color: rgba(44,162,95,.22); }
.lx-case-bubbles span:nth-child(4n) { border-color: rgba(204,83,243,.18); }
@keyframes lxBubbleDrift { to { transform: translate3d(calc((var(--bubble-i) % 3 - 1) * 34px), -46px, 0) scale(1.15); } }

.lx-case-grid-bubbling { position: relative; z-index: 2; align-items: center; gap: 28px; }
.lx-case-bubble-card {
  --card-x: 0; --card-y: 0; position: relative; overflow: hidden; opacity: 0;
  transform: translateY(72px) scale(.93) rotate(calc((var(--case-i) - 1) * 1.2deg));
  transition: opacity .7s ease, transform .8s cubic-bezier(.2,.78,.2,1), box-shadow .35s ease, border-radius .35s ease, background .35s ease;
}
.lx-case-bubble-card.is-visible {
  opacity: 1;
  transform: translateY(calc(var(--card-y) * 7px)) translateX(calc(var(--card-x) * 7px)) scale(1) rotate(calc((var(--case-i) - 1) * 1.2deg));
  animation: lxCaseFloat calc(6.2s + (var(--case-i) * .9s)) ease-in-out infinite alternate;
}
.lx-case-bubble-card.is-visible:nth-child(2) { transition-delay: .12s; }
.lx-case-bubble-card.is-visible:nth-child(3) { transition-delay: .24s; }
@keyframes lxCaseFloat { 50% { translate: 0 -12px; } }

.lx-case-bubble-card:hover { z-index: 8; border-radius: 44px 28px 48px 34px; background: #fff; box-shadow: 0 28px 80px rgba(0,0,0,.12); transform: translateY(-18px) scale(1.035) rotate(0deg) !important; }
.lx-case-bubble-card::before, .lx-case-bubble-card::after, .lx-case-orbit { content: ""; position: absolute; border-radius: 50%; pointer-events: none; }
.lx-case-bubble-card::before { width: 96px; height: 96px; right: -24px; top: -22px; border: 1px solid rgba(31,120,200,.23); }
.lx-case-bubble-card::after { width: 54px; height: 54px; right: 50px; top: 38px; border: 1px solid rgba(44,162,95,.25); }
.lx-case-orbit-a { width: 22px; height: 22px; right: 18%; top: 20%; border: 1px solid rgba(255,79,67,.3); }
.lx-case-orbit-b { width: 34px; height: 34px; left: 8%; bottom: 13%; border: 1px solid rgba(204,83,243,.25); }
.lx-case-bubble-card:hover .lx-case-orbit-a { animation: lxOrbitA 2.4s linear infinite; }
.lx-case-bubble-card:hover .lx-case-orbit-b { animation: lxOrbitB 2.8s linear infinite reverse; }
@keyframes lxOrbitA { to { transform: rotate(360deg) translateX(18px) rotate(-360deg); } }
@keyframes lxOrbitB { to { transform: rotate(360deg) translateX(24px) rotate(-360deg); } }

@media (max-width: 980px) {
  .lx-doodle-band { min-height: 700px; padding: 90px 28px 120px; }
  .lx-doodle-copy { width: min(760px, 100%); }
  .lx-doodle-books-cup { width: 200px; height: 170px; opacity: .62; }
  .lx-doodle-lamp-plant { width: 230px; height: 210px; opacity: .62; }
  .lx-case-grid-bubbling { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .lx-avatar-stack span, .lx-collab-arrow, .lx-doodle-books-cup, .lx-doodle-lamp-plant, .lx-case-bubbles span, .lx-case-bubble-card.is-visible, .lx-case-bubble-card:hover .lx-case-orbit-a, .lx-case-bubble-card:hover .lx-case-orbit-b { animation: none !important; }
  .lx-case-bubble-card { opacity: 1; transform: none; }
}
'@
$cssContent = $cssContent + $css
Write-Utf8 $cssPath $cssContent
}

Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue
Write-Host "Dynamic doodles and bubbling cases integrated." -ForegroundColor Green
Write-Host "Run: npm.cmd run build" -ForegroundColor Cyan

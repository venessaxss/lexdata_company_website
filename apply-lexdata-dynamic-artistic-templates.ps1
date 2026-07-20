$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$parent = Split-Path $root -Parent
$backupRoot = Join-Path $parent ("lexdata_dynamic_art_backup_" + $stamp)

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

Backup-File "components\IntegratedHomePage.tsx"
Backup-File "components\DynamicArtisticStatement.tsx"
Backup-File "content\artisticTemplates.ts"
Backup-File "app\ellipsus-home.css"

$templates = @'
export type ArtisticTemplate = {
  id: "desk" | "orbit" | "archive" | "notes";
  label: string;
  accent: string;
};

export const artisticTemplates: ArtisticTemplate[] = [
  { id: "desk", label: "Research desk", accent: "Human judgment" },
  { id: "orbit", label: "Idea orbit", accent: "Context over opacity" },
  { id: "archive", label: "Living archive", accent: "Your work stays yours" },
  { id: "notes", label: "Margin notes", accent: "Researchers stay in control" },
];
'@

Write-Utf8 (Join-Path $root "content\artisticTemplates.ts") $templates

$component = @'
"use client";

import { useEffect, useRef, useState } from "react";
import { artisticTemplates } from "@/content/artisticTemplates";

function ArtisticVisual({ id }: { id: string }) {
  if (id === "desk") {
    return (
      <div className="lx-art-scene lx-art-scene-desk" aria-hidden="true">
        <div className="lx-art-paper lx-art-paper-a">
          <span>FIELD NOTES</span><i /><i /><i />
        </div>
        <div className="lx-art-paper lx-art-paper-b">
          <span>CORPUS</span><strong>01</strong>
        </div>
        <div className="lx-art-laptop">
          <small>HUMAN</small><strong>IN THE LOOP</strong>
        </div>
        <div className="lx-art-sticky">ask<br /><b>better questions</b></div>
      </div>
    );
  }

  if (id === "orbit") {
    return (
      <div className="lx-art-scene lx-art-scene-orbit" aria-hidden="true">
        <div className="lx-art-core"><span>HUMAN</span><strong>JUDGMENT</strong></div>
        <div className="lx-art-ring lx-art-ring-a"><span>CONTEXT</span></div>
        <div className="lx-art-ring lx-art-ring-b"><span>LANGUAGE</span></div>
        <div className="lx-art-ring lx-art-ring-c"><span>EVIDENCE</span></div>
        <i className="lx-art-dot lx-art-dot-a" />
        <i className="lx-art-dot lx-art-dot-b" />
        <i className="lx-art-dot lx-art-dot-c" />
      </div>
    );
  }

  if (id === "archive") {
    return (
      <div className="lx-art-scene lx-art-scene-archive" aria-hidden="true">
        <div className="lx-art-card lx-art-card-a"><span>ARCHIVE 04</span><strong>YOUR DATA</strong></div>
        <div className="lx-art-card lx-art-card-b"><span>ANNOTATION</span><strong>CONTEXT</strong></div>
        <div className="lx-art-card lx-art-card-c"><span>RESEARCH</span><strong>MEMORY</strong></div>
        <div className="lx-art-folder"><span>PRIVATE</span><strong>WORKING FILES</strong></div>
      </div>
    );
  }

  return (
    <div className="lx-art-scene lx-art-scene-notes" aria-hidden="true">
      <div className="lx-art-sheet">
        <span>RESEARCH DRAFT</span>
        <p>language is not a checkbox.<br />context is not optional.</p>
        <strong>keep the researcher in control</strong>
      </div>
      <i className="lx-art-note lx-art-note-a">why?</i>
      <i className="lx-art-note lx-art-note-b">verify this</i>
      <i className="lx-art-note lx-art-note-c">human first</i>
    </div>
  );
}

export default function DynamicArtisticStatement() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio > 0.2),
      { threshold: [0, 0.2, 0.5] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % artisticTemplates.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [visible, paused]);

  const active = artisticTemplates[activeIndex];

  const goTo = (index: number) => {
    setActiveIndex((index + artisticTemplates.length) % artisticTemplates.length);
  };

  return (
    <div
      ref={sectionRef}
      className="lx-art-dynamic"
      data-template={active.id}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="lx-art-visual">
        <div key={active.id} className="lx-art-template-frame">
          <ArtisticVisual id={active.id} />
        </div>
        <div className="lx-art-template-label">
          <span>{String(activeIndex + 1).padStart(2, "0")}</span>
          <strong>{active.label}</strong>
        </div>
      </div>

      <div className="lx-art-copy-panel">
        <p className="lx-art-eyebrow">RESEARCH, NOT OPAQUE AUTOMATION</p>

        <h3>
          We think researchers should be free to{" "}
          <span className="lx-art-underline">express their creative vision</span>{" "}
          — away from opaque automation and the{" "}
          <span className="lx-art-circle">prying eyes of AI.</span>
        </h3>

        <div className="lx-art-principle">
          <span>Your content is</span>
          <strong>YOURS.</strong>
          <span>Human judgment stays in control.</span>
        </div>

        <div className="lx-art-controls">
          <button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="Previous template">←</button>

          <div className="lx-art-dots">
            {artisticTemplates.map((template, index) => (
              <button
                key={template.id}
                type="button"
                className={index === activeIndex ? "is-active" : ""}
                aria-label={`Show ${template.label}`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>

          <button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="Next template">→</button>
        </div>

        <p className="lx-art-accent-note">{active.accent}</p>
      </div>
    </div>
  );
}
'@

Write-Utf8 (Join-Path $root "components\DynamicArtisticStatement.tsx") $component

$homePath = Join-Path $root "components\IntegratedHomePage.tsx"
$homePageContent = [System.IO.File]::ReadAllText($homePath)

if ($homePageContent -notmatch 'DynamicArtisticStatement') {
    $homePageContent = $homePageContent.Replace(
        'import WorkshopNoticeSlider from "@/components/WorkshopNoticeSlider";',
        'import WorkshopNoticeSlider from "@/components/WorkshopNoticeSlider";' + "`r`n" +
        'import DynamicArtisticStatement from "@/components/DynamicArtisticStatement";'
    )
}

$pattern = '(?s)\s*<div className="lx-ai-stance">.*?\r?\n\s*</div>\r?\n\s*</section>'

if ([regex]::IsMatch($homePageContent, $pattern)) {
    $homePageContent = [regex]::Replace(
        $homePageContent,
        $pattern,
        "`r`n          <DynamicArtisticStatement />`r`n        </section>",
        1
    )
} else {
    Write-Host "WARNING: Could not locate old lx-ai-stance block automatically." -ForegroundColor Yellow
}

Write-Utf8 $homePath $homePageContent

$cssPath = Join-Path $root "app\ellipsus-home.css"
$cssContent = [System.IO.File]::ReadAllText($cssPath)
$marker = "/* LEXDATA DYNAMIC ART TEMPLATES */"

if (-not $cssContent.Contains($marker)) {
    $css = @'

/* LEXDATA DYNAMIC ART TEMPLATES */

.lx-art-dynamic {
  display: grid;
  grid-template-columns: 1.02fr .98fr;
  min-height: 720px;
  margin-top: clamp(80px, 10vw, 150px);
  overflow: hidden;
  border-top: 1px solid rgba(0,0,0,.12);
  background: #f7f5f0;
  color: #111;
}

.lx-art-visual {
  position: relative;
  min-height: 720px;
  overflow: hidden;
  background: #efeae1;
}

.lx-art-template-frame {
  position: absolute;
  inset: 0;
  animation: lx-art-in .65s cubic-bezier(.2,.8,.2,1) both;
}

@keyframes lx-art-in {
  from { opacity: 0; transform: translateY(18px) scale(.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.lx-art-template-label {
  position: absolute;
  left: 28px;
  bottom: 24px;
  z-index: 20;
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(0,0,0,.18);
  border-radius: 999px;
  background: rgba(255,255,255,.72);
  backdrop-filter: blur(10px);
  font-size: 12px;
}

.lx-art-template-label span { opacity: .45; }

.lx-art-copy-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(48px, 6vw, 96px);
  background: #fbfaf7;
}

.lx-art-eyebrow {
  margin: 0 0 22px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .22em;
  color: #267bc2;
}

.lx-art-copy-panel h3 {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  font-size: clamp(40px, 4.5vw, 72px);
  font-weight: 400;
  line-height: 1.04;
  letter-spacing: -.04em;
}

.lx-art-underline,
.lx-art-circle {
  position: relative;
}

.lx-art-underline::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -.08em;
  border-bottom: 2px solid #14a552;
  transform: rotate(-1deg);
}

.lx-art-circle {
  display: inline-block;
}

.lx-art-circle::after {
  content: "";
  position: absolute;
  inset: -.05em -.12em;
  border: 2px solid #f14d3f;
  border-radius: 50%;
  transform: rotate(1.5deg);
}

.lx-art-principle {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 46px;
  color: #0b9f45;
  font-size: clamp(15px, 1.3vw, 20px);
}

.lx-art-controls {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 30px;
}

.lx-art-controls > button {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(0,0,0,.22);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.lx-art-controls > button:hover {
  background: #111;
  color: #fff;
}

.lx-art-dots {
  display: flex;
  gap: 7px;
}

.lx-art-dots button {
  width: 22px;
  height: 3px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(0,0,0,.18);
  cursor: pointer;
}

.lx-art-dots button.is-active {
  width: 52px;
  background: #111;
}

.lx-art-accent-note {
  margin-top: 18px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  opacity: .5;
}

.lx-art-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* desk */
.lx-art-scene-desk { background: #f3efe7; }
.lx-art-paper {
  position: absolute;
  padding: 24px;
  border: 2px solid #111;
  background: #fffdf8;
  box-shadow: 10px 12px 0 rgba(0,0,0,.05);
}
.lx-art-paper-a { left: 8%; top: 12%; width: 36%; height: 32%; transform: rotate(-5deg); }
.lx-art-paper-b { right: 8%; top: 14%; width: 25%; height: 23%; transform: rotate(7deg); }
.lx-art-paper span { font-size: 10px; letter-spacing: .18em; }
.lx-art-paper i { display:block; width:80%; height:2px; margin-top:14px; background:rgba(0,0,0,.2); }
.lx-art-paper strong { display:block; margin-top:28px; font:400 54px Georgia,serif; }
.lx-art-laptop {
  position:absolute; left:23%; bottom:13%; width:54%; height:31%;
  display:grid; place-items:center; align-content:center;
  border:3px solid #111; border-radius:18px; background:#d8e8f8;
}
.lx-art-laptop small { letter-spacing:.18em; }
.lx-art-laptop strong { margin-top:8px; font:400 clamp(28px,4vw,50px) Georgia,serif; }
.lx-art-sticky {
  position:absolute; right:7%; bottom:8%; padding:16px 20px;
  border:1px solid #111; background:#f7cfe1; transform:rotate(4deg);
}

/* orbit */
.lx-art-scene-orbit { display:grid; place-items:center; background:#f4f0e8; }
.lx-art-core {
  position:absolute; z-index:5; width:200px; aspect-ratio:1;
  display:grid; place-items:center; align-content:center;
  border-radius:50%; background:#111; color:#fff; text-align:center;
}
.lx-art-core span { font-size:10px; letter-spacing:.18em; }
.lx-art-core strong { margin-top:8px; font:400 28px Georgia,serif; }
.lx-art-ring {
  position:absolute; display:grid; place-items:start center;
  border:1px solid rgba(0,0,0,.28); border-radius:50%;
}
.lx-art-ring span { margin-top:-9px; padding:2px 7px; background:#f4f0e8; font-size:10px; letter-spacing:.15em; }
.lx-art-ring-a { width:52%; height:34%; transform:rotate(14deg); }
.lx-art-ring-b { width:68%; height:48%; transform:rotate(-18deg); }
.lx-art-ring-c { width:82%; height:62%; transform:rotate(7deg); }
.lx-art-dot { position:absolute; width:18px; height:18px; border-radius:50%; }
.lx-art-dot-a { left:20%; top:25%; background:#f14d3f; }
.lx-art-dot-b { right:16%; bottom:30%; background:#267bc2; }
.lx-art-dot-c { left:30%; bottom:15%; background:#14a552; }

/* archive */
.lx-art-scene-archive {
  background:
    linear-gradient(rgba(0,0,0,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,.035) 1px, transparent 1px),
    #efeae1;
  background-size:28px 28px;
}
.lx-art-card {
  position:absolute; display:flex; flex-direction:column;
  padding:24px; border:2px solid #111; background:#fffdf8;
  box-shadow:10px 12px 0 rgba(0,0,0,.05);
}
.lx-art-card span { font-size:10px; letter-spacing:.15em; }
.lx-art-card strong { margin-top:auto; font:400 clamp(25px,3vw,46px) Georgia,serif; }
.lx-art-card-a { left:8%; top:13%; width:35%; height:32%; transform:rotate(-5deg); }
.lx-art-card-b { right:9%; top:10%; width:31%; height:26%; transform:rotate(6deg); background:#dcecff; }
.lx-art-card-c { right:18%; bottom:12%; width:33%; height:25%; transform:rotate(-4deg); background:#f7cfe1; }
.lx-art-folder {
  position:absolute; left:11%; bottom:10%; width:41%; height:25%;
  padding:26px; border:2px solid #111; background:#e6d468; transform:rotate(2deg);
}
.lx-art-folder span { font-size:10px; letter-spacing:.16em; }
.lx-art-folder strong { display:block; margin-top:14px; font:400 clamp(25px,3vw,42px) Georgia,serif; }

/* notes */
.lx-art-scene-notes { background:#f3eee5; }
.lx-art-sheet {
  position:absolute; left:14%; top:10%; width:61%; height:70%;
  padding:clamp(28px,5vw,58px); border:2px solid #111; background:#fffdf8;
  box-shadow:16px 18px 0 rgba(0,0,0,.05); transform:rotate(-2deg);
}
.lx-art-sheet > span { font-size:10px; letter-spacing:.2em; }
.lx-art-sheet p { margin-top:42px; font:400 clamp(28px,4vw,54px)/1.02 Georgia,serif; }
.lx-art-sheet strong {
  position:absolute; left:9%; right:9%; bottom:10%;
  background:linear-gradient(transparent 30%, rgba(240,196,65,.65) 30%, rgba(240,196,65,.65) 86%, transparent 86%);
  font-size:clamp(17px,2vw,28px);
}
.lx-art-note {
  position:absolute; padding:9px 13px; border:1px solid #111; border-radius:999px;
  background:#fff; font-style:normal; box-shadow:5px 5px 0 rgba(0,0,0,.05);
}
.lx-art-note-a { right:7%; top:18%; transform:rotate(8deg); }
.lx-art-note-b { right:4%; top:42%; background:#f7cfe1; transform:rotate(-5deg); }
.lx-art-note-c { right:11%; bottom:14%; background:#cce9d4; transform:rotate(6deg); }

@media (max-width: 980px) {
  .lx-art-dynamic { grid-template-columns:1fr; }
  .lx-art-visual { min-height:600px; }
  .lx-art-copy-panel { padding:52px 28px 68px; }
}

@media (max-width: 640px) {
  .lx-art-visual { min-height:480px; }
  .lx-art-copy-panel h3 { font-size:clamp(34px,10vw,50px); }
}
'@

    $cssContent += $css
    Write-Utf8 $cssPath $cssContent
}

Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Dynamic artistic templates integrated." -ForegroundColor Green
Write-Host "Templates: Research desk, Idea orbit, Living archive, Margin notes"
Write-Host "Auto-rotates every 6.5 seconds while visible."
Write-Host "Run: npm.cmd run build"

# Safe LexData paper-style visual apply script
# Applies the uploaded lexdata-paper-style files without touching auth/session files.
# Run from the project root.

$ErrorActionPreference = "Stop"
$root = Get-Location
$patchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$filesRoot = Join-Path $patchRoot "files"
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $root "_backup_before_paper_style_$stamp"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Ensure-Dir($p) {
  if (!(Test-Path $p)) { New-Item -ItemType Directory -Force $p | Out-Null }
}

function Backup-File($rel) {
  $src = Join-Path $root $rel
  if (Test-Path $src) {
    $dst = Join-Path $backup $rel
    Ensure-Dir (Split-Path -Parent $dst)
    Copy-Item $src $dst -Force
  }
}

function Copy-Patch-File($rel) {
  $src = Join-Path $filesRoot $rel
  $dst = Join-Path $root $rel
  if (!(Test-Path $src)) { throw "Patch file missing: $src" }
  Ensure-Dir (Split-Path -Parent $dst)
  Copy-Item $src $dst -Force
  Write-Host "Wrote $rel"
}

Ensure-Dir $backup

# Back up the exact visual files we change.
Backup-File "app\page.tsx"
Backup-File "app\paper-theme.css"
Backup-File "app\globals.css"
Backup-File "app\layout.tsx"
Backup-File "components\site\PaperMotion.tsx"
Backup-File "components\site\scribbles.tsx"

# Copy the paper style files from the uploaded zip.
Copy-Patch-File "app\page.tsx"
Copy-Patch-File "app\paper-theme.css"
Copy-Patch-File "components\site\PaperMotion.tsx"
Copy-Patch-File "components\site\scribbles.tsx"

# Make globals.css import the paper theme at the very top.
$globalsPath = Join-Path $root "app\globals.css"
if (!(Test-Path $globalsPath)) {
  [System.IO.File]::WriteAllText($globalsPath, '@import "./paper-theme.css";' + "`r`n", $utf8NoBom)
} else {
  $globals = [System.IO.File]::ReadAllText($globalsPath)
  if ($globals -notmatch '@import\s+["'']\./paper-theme\.css["''];') {
    $globals = '@import "./paper-theme.css";' + "`r`n" + $globals.TrimStart()
    [System.IO.File]::WriteAllText($globalsPath, $globals, $utf8NoBom)
    Write-Host "Updated app\globals.css import"
  } else {
    Write-Host "app\globals.css already imports paper-theme.css"
  }
}

# Patch layout safely: preserve current navbar/auth/layout, only mount PaperMotion.
$layoutPath = Join-Path $root "app\layout.tsx"
if (Test-Path $layoutPath) {
  $layout = [System.IO.File]::ReadAllText($layoutPath)

  # Fix a common broken metadata template string from older patch attempts.
  $layout = [regex]::Replace(
    $layout,
    'title:\s*\$\{site\.name\}\s*\|\s*Data-driven Research Training Platform,',
    'title: `${site.name} | Data-driven Research Training Platform`,'
  )

  # Add import once.
  $paperImport = 'import { PaperMotion } from "@/components/site/PaperMotion";'
  if ($layout -notmatch 'components/site/PaperMotion') {
    $layout = $paperImport + "`r`n" + $layout
  }

  # Remove duplicate PaperMotion placements.
  $layout = [regex]::Replace($layout, '\s*<PaperMotion\s*/>\s*', "`r`n")

  # Insert after the opening body tag, preserving everything else.
  if ($layout -match '<body[^>]*>') {
    $bodyTag = $Matches[0]
    $layout = $layout.Replace($bodyTag, $bodyTag + "`r`n        <PaperMotion />")
  } else {
    Write-Warning "Could not find <body> in app\layout.tsx; PaperMotion import was added but not mounted."
  }

  [System.IO.File]::WriteAllText($layoutPath, $layout, $utf8NoBom)
  Write-Host "Updated app\layout.tsx with PaperMotion"
} else {
  Write-Warning "app\layout.tsx not found. Skipped PaperMotion mounting."
}

Write-Host ""
Write-Host "Paper-style visual patch applied. Backup saved to: $backup"
Write-Host "Next: Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue; npm.cmd run build"

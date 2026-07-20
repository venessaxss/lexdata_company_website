$ErrorActionPreference = "Stop"

$root = Get-Location
$patchRoot = Join-Path $root "_final_restore_apply\lexdata_final_restore_patch"
$filesRoot = Join-Path $patchRoot "files"
$backupRoot = Join-Path $root ("_final_restore_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Backup-Path($relative) {
  $target = Join-Path $root $relative
  if (Test-Path $target) {
    $dest = Join-Path $backupRoot $relative
    New-Item -ItemType Directory -Force (Split-Path -Parent $dest) | Out-Null
    Copy-Item $target $dest -Recurse -Force
  }
}

function Copy-PatchedFile($relative) {
  $src = Join-Path $filesRoot $relative
  $dest = Join-Path $root $relative

  if (!(Test-Path $src)) {
    throw "Missing patch file: $relative"
  }

  Backup-Path $relative
  New-Item -ItemType Directory -Force (Split-Path -Parent $dest) | Out-Null
  Copy-Item $src $dest -Force
  Write-Host "Wrote $relative"
}

$paths = @(
  "proxy.ts",
  "lib\auth.ts",
  "lib\supabase\server.ts",
  "lib\supabase\client.ts",
  "components\AuthSync.tsx",
  "components\PaperTypewriterLine.tsx",
  "components\IntegratedHomePage.tsx",
  "app\page.tsx",
  "app\ellipsus-home.css",
  "app\about\page.tsx",
  "app\team\page.tsx",
  "app\login\actions.ts",
  "scripts\scan-protected-auth.cjs"
)

foreach ($p in $paths) {
  Copy-PatchedFile $p
}

# Import Ellipsus homepage CSS once.
$globalsPath = Join-Path $root "app\globals.css"
if (Test-Path $globalsPath) {
  Backup-Path "app\globals.css"
  $globals = [System.IO.File]::ReadAllText($globalsPath)

  if ($globals -notmatch '@import "\.\/ellipsus-home\.css";') {
    $globals = '@import "./ellipsus-home.css";' + "`r`n" + $globals
    [System.IO.File]::WriteAllText($globalsPath, $globals, $utf8NoBom)
    Write-Host "Patched app\globals.css"
  }
}

# Mount AuthSync safely in the existing layout without replacing navbar.
$layoutPath = Join-Path $root "app\layout.tsx"
if (Test-Path $layoutPath) {
  Backup-Path "app\layout.tsx"
  $layout = [System.IO.File]::ReadAllText($layoutPath)

  $layout = [regex]::Replace(
    $layout,
    'title:\s*\$\{site\.name\}\s*\|\s*Data-driven Research Training Platform,',
    'title: `${site.name} | Data-driven Research Training Platform`,'
  )

  if ($layout -notmatch 'import AuthSync from "@/components/AuthSync";') {
    $firstImport = [regex]::Match($layout, 'import[^\r\n]+;')

    if ($firstImport.Success) {
      $layout = $layout.Insert(
        $firstImport.Index + $firstImport.Length,
        "`r`n" + 'import AuthSync from "@/components/AuthSync";'
      )
    } else {
      $layout = 'import AuthSync from "@/components/AuthSync";' + "`r`n" + $layout
    }
  }

  $layout = [regex]::Replace($layout, '\s*<AuthSync\s*/>\s*', "`r`n")

  $closeBody = $layout.LastIndexOf("</body>")
  if ($closeBody -ge 0) {
    $layout = $layout.Substring(0, $closeBody) + "        <AuthSync />`r`n      " + $layout.Substring($closeBody)
  }

  [System.IO.File]::WriteAllText($layoutPath, $layout, $utf8NoBom)
  Write-Host "Patched app\layout.tsx"
}

# Disable old middleware. proxy.ts must be the only login/session gate.
$backupMw = Join-Path $root "_backups"
New-Item -ItemType Directory -Force $backupMw | Out-Null

foreach ($mw in @("middleware.ts", "middleware.js", "middleware.mjs")) {
  $mwPath = Join-Path $root $mw

  if (Test-Path $mwPath) {
    $dest = Join-Path $backupMw ($mw + ".disabled.txt")
    Move-Item $mwPath $dest -Force
    Write-Host "Disabled $mw"
  }
}

# Remove direct /login redirects inside protected sections.
foreach ($dir in @("app\dashboard", "app\admin", "app\manager", "app\my", "app\speaker")) {
  $fullDir = Join-Path $root $dir
  if (!(Test-Path $fullDir)) { continue }

  Get-ChildItem -Path $fullDir -Recurse -File -Include *.ts,*.tsx | ForEach-Object {
    $text = [System.IO.File]::ReadAllText($_.FullName)
    $before = $text

    $text = [regex]::Replace(
      $text,
      'redirect\(["'']\/login(?:\?[^"'']*)?["'']\)',
      'redirect("/unauthorized")'
    )

    $text = $text.Replace('/login?redirect=', '/login?next=')

    if ($text -ne $before) {
      [System.IO.File]::WriteAllText($_.FullName, $text, $utf8NoBom)
      Write-Host "Cleaned protected redirect $($_.FullName)"
    }
  }
}

Write-Host ""
Write-Host "Final restore applied. Backup saved to: $backupRoot"
Write-Host "Next: npm.cmd run build"
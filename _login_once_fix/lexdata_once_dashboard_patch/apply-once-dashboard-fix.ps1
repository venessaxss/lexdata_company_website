$ErrorActionPreference = "Stop"

$root = Get-Location
$patchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$filesRoot = Join-Path $patchRoot "files"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Copy-PatchFile($relativePath) {
  $source = Join-Path $filesRoot $relativePath
  $target = Join-Path $root $relativePath
  $targetDir = Split-Path -Parent $target
  New-Item -ItemType Directory -Force $targetDir | Out-Null
  Copy-Item $source $target -Force
  Write-Host "Wrote $relativePath"
}

$paths = @(
  "proxy.ts",
  "lib\auth.ts",
  "lib\supabase\server.ts",
  "lib\supabase\client.ts",
  "components\AuthSync.tsx",
  "app\login\actions.ts",
  "app\login\page.tsx",
  "app\admin\layout.tsx",
  "app\admin\page.tsx",
  "app\admin\registrations\page.tsx",
  "app\admin\registrations\actions.ts",
  "app\manager\layout.tsx",
  "app\manager\page.tsx",
  "app\manager\registrations\page.tsx",
  "app\dashboard\layout.tsx",
  "app\dashboard\messages\page.tsx",
  "app\dashboard\messages\actions.ts",
  "app\dashboard\messages\send\page.tsx",
  "app\dashboard\messages\send\actions.ts",
  "app\my\layout.tsx",
  "app\speaker\layout.tsx",
  "scripts\scan-protected-auth.cjs"
)

foreach ($path in $paths) {
  Copy-PatchFile $path
}

# Disable old middleware so only proxy.ts owns login redirect and cookie refresh.
New-Item -ItemType Directory -Force "_backups" | Out-Null
foreach ($mw in @("middleware.ts", "middleware.js", "middleware.mjs")) {
  if (Test-Path $mw) {
    Move-Item $mw (Join-Path "_backups" "$mw.disabled.txt") -Force
    Write-Host "Disabled $mw"
  }
}

# Mount AuthSync in existing layout without changing navbar/homepage design.
$layoutPath = Join-Path $root "app\layout.tsx"
$layout = [System.IO.File]::ReadAllText($layoutPath)

if ($layout -notmatch 'import AuthSync from "@/components/AuthSync";') {
  $layout = $layout -replace '(import[^\r\n]+;\r?\n)', ('$1' + 'import AuthSync from "@/components/AuthSync";' + "`r`n")
}

# Remove duplicate placements first.
$layout = $layout -replace '\s*<AuthSync\s*/>\s*', "`r`n"

# Put AuthSync as the last body child; it returns null, so it cannot affect visuals.
$layout = $layout -replace '</body>', '        <AuthSync />' + "`r`n" + '      </body>'
[System.IO.File]::WriteAllText($layoutPath, $layout, $utf8NoBom)
Write-Host "Mounted AuthSync in app/layout.tsx"

# Remove stale direct login redirects in remaining protected files to prevent second-login loops.
$protectedRoots = @("app\dashboard", "app\admin", "app\manager", "app\my", "app\speaker")
foreach ($dir in $protectedRoots) {
  if (!(Test-Path $dir)) { continue }
  Get-ChildItem $dir -Recurse -Include *.ts,*.tsx | ForEach-Object {
    $text = [System.IO.File]::ReadAllText($_.FullName)
    $before = $text
    $text = [regex]::Replace($text, 'redirect\(["'']\/login(?:\?[^"'']*)?["'']\)', 'redirect("/unauthorized")')
    $text = [regex]::Replace($text, '\/login\?redirect=', '/login?next=')
    if ($text -ne $before) {
      [System.IO.File]::WriteAllText($_.FullName, $text, $utf8NoBom)
      Write-Host "Cleaned protected redirect $($_.FullName)"
    }
  }
}

node scripts\scan-protected-auth.cjs
Write-Host "Complete. Now run: npm.cmd run build"

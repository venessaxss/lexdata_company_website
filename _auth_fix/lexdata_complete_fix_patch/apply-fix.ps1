# Apply complete LexData relogin + registration fix.
# Run this from your project root.

$ErrorActionPreference = "Stop"
$root = Get-Location
$patchRoot = Join-Path $PSScriptRoot "files"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$files = @(
  "proxy.ts",
  "components\AuthSync.tsx",
  "app\layout.tsx",
  "app\login\actions.ts",
  "app\login\page.tsx",
  "app\manager\registrations\page.tsx",
  "app\admin\registrations\actions.ts",
  "app\admin\page.tsx",
  "lib\auth.ts",
  "lib\supabase\client.ts"
)

foreach ($file in $files) {
  $src = Join-Path $patchRoot $file
  $dst = Join-Path $root $file
  New-Item -ItemType Directory -Force (Split-Path $dst) | Out-Null
  Copy-Item $src $dst -Force
  Write-Host "Applied $file"
}

# Next 16 cannot use middleware.ts and proxy.ts together.
# Disable middleware.ts if it exists.
New-Item -ItemType Directory -Force "_backups" | Out-Null
if (Test-Path "middleware.ts") {
  Move-Item "middleware.ts" "_backups\middleware.ts.disabled.txt" -Force
  Write-Host "Disabled middleware.ts"
}
if (Test-Path "middleware.js") {
  Move-Item "middleware.js" "_backups\middleware.js.disabled.txt" -Force
}
if (Test-Path "middleware.mjs") {
  Move-Item "middleware.mjs" "_backups\middleware.mjs.disabled.txt" -Force
}

# Clean broken env formatting if present.
if (Test-Path ".env.local") {
  $envText = [System.IO.File]::ReadAllText((Join-Path $root ".env.local"))
  $envText = $envText -replace '(?m)^(NEXT_PUBLIC_SUPABASE_URL=)\s+', '$1'
  $envText = $envText -replace '(?m)^(NEXT_PUBLIC_SUPABASE_ANON_KEY=)\s+', '$1'
  $envText = $envText -replace '(?m)^(SUPABASE_SERVICE_ROLE_KEY=)\s+', '$1'
  [System.IO.File]::WriteAllText((Join-Path $root ".env.local"), $envText, $utf8NoBom)
}

Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Write-Host "Done. Now run: npm.cmd install ; npm.cmd run build"

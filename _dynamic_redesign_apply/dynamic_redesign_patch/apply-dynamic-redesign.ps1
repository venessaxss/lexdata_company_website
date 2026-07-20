$ErrorActionPreference = "Stop"

$Root = Get-Location
$PatchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupRoot = Join-Path $Root ("_dynamic_redesign_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Backup-IfExists($RelativePath) {
  $Source = Join-Path $Root $RelativePath
  if (Test-Path $Source) {
    $Dest = Join-Path $BackupRoot $RelativePath
    New-Item -ItemType Directory -Force (Split-Path -Parent $Dest) | Out-Null
    Copy-Item $Source $Dest -Force
    Write-Host "Backed up $RelativePath"
  }
}

function Copy-PatchFile($RelativePath) {
  $Source = Join-Path $PatchRoot ("files\" + $RelativePath)
  $Dest = Join-Path $Root $RelativePath
  New-Item -ItemType Directory -Force (Split-Path -Parent $Dest) | Out-Null
  Copy-Item $Source $Dest -Force
  Write-Host "Wrote $RelativePath"
}

New-Item -ItemType Directory -Force $BackupRoot | Out-Null

Backup-IfExists "app\page.tsx"
Backup-IfExists "app\lexdata-theme.css"
Backup-IfExists "components\motion.tsx"
Backup-IfExists "app\layout.tsx"

Copy-PatchFile "app\page.tsx"
Copy-PatchFile "app\lexdata-theme.css"
Copy-PatchFile "components\motion.tsx"

# Import the dynamic theme CSS from the root layout without replacing the layout/navbar/auth.
$LayoutPath = Join-Path $Root "app\layout.tsx"
if (Test-Path $LayoutPath) {
  $Layout = [System.IO.File]::ReadAllText($LayoutPath)

  if ($Layout -notmatch 'import "\.\/lexdata-theme\.css";') {
    if ($Layout -match 'import "\.\/globals\.css";') {
      $Layout = $Layout.Replace('import "./globals.css";', 'import "./globals.css";' + "`r`n" + 'import "./lexdata-theme.css";')
    } elseif ($Layout -match "import '\.\/globals\.css';") {
      $Layout = $Layout.Replace("import './globals.css';", "import './globals.css';" + "`r`n" + 'import "./lexdata-theme.css";')
    } else {
      $Layout = 'import "./lexdata-theme.css";' + "`r`n" + $Layout
    }

    [System.IO.File]::WriteAllText($LayoutPath, $Layout, $Utf8NoBom)
    Write-Host "Updated app\layout.tsx CSS import"
  } else {
    Write-Host "app\layout.tsx already imports lexdata-theme.css"
  }
}

# Disable old middleware if present. Keep proxy.ts untouched.
New-Item -ItemType Directory -Force (Join-Path $Root "_backups") | Out-Null
foreach ($Mw in @("middleware.ts", "middleware.js", "middleware.mjs")) {
  $MwPath = Join-Path $Root $Mw
  if (Test-Path $MwPath) {
    Move-Item $MwPath (Join-Path $Root ("_backups\" + $Mw + ".disabled.txt")) -Force
    Write-Host "Disabled $Mw"
  }
}

Write-Host "Dynamic redesign applied. Backup saved to: $BackupRoot"

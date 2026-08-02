$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$installerPath = Join-Path $root "install-intern-hiring-slider.ps1"

if (-not (Test-Path -LiteralPath $installerPath)) {
    throw "Cannot find install-intern-hiring-slider.ps1. Run this script from the same project folder."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $root "install-intern-hiring-slider.ps1.backup-$timestamp"
Copy-Item -LiteralPath $installerPath -Destination $backupPath -Force

$utf8 = New-Object System.Text.UTF8Encoding($false)

$content = [System.IO.File]::ReadAllText(
    $installerPath,
    [System.Text.Encoding]::UTF8
)

$before = $content

# PowerShell variable names are case-insensitive.
# $home conflicts with the built-in read-only $HOME variable.
$content = [System.Text.RegularExpressions.Regex]::Replace(
    $content,
    '(?<![A-Za-z0-9_])\$home(?![A-Za-z0-9_])',
    '$homeContent'
)

if ($content -eq $before) {
    throw "The conflicting `$home variable was not found in the installer."
}

[System.IO.File]::WriteAllText(
    $installerPath,
    $content,
    $utf8
)

Write-Host ""
Write-Host "Fixed the read-only HOME variable conflict." -ForegroundColor Green
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupPath"
Write-Host ""
Write-Host "Re-running the internship slider installer..." -ForegroundColor Yellow
Write-Host ""

powershell -ExecutionPolicy Bypass -File $installerPath

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "The installer still failed." -ForegroundColor Red
    Write-Host "Original installer backup:" -ForegroundColor Yellow
    Write-Host "  $backupPath"
    exit 1
}

Write-Host ""
Write-Host "INTERN HIRING SLIDER INSTALLATION COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "Start the site with:" -ForegroundColor Cyan
Write-Host "  npm.cmd run dev"

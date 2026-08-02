param(
    [string]$PosterPath = ""
)

$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$installerPath = Join-Path $root "install-intern-slider-and-poster.ps1"

if (-not (Test-Path -LiteralPath $installerPath)) {
    throw "Cannot find install-intern-slider-and-poster.ps1. Run this script from the project root."
}

if (-not $PosterPath) {
    $preferred = Join-Path $root "public\posters\cisma-lexdata-intern-poster.png"

    if (Test-Path -LiteralPath $preferred) {
        $PosterPath = $preferred
    }
    else {
        $posterDirectory = Join-Path $root "public\posters"

        $candidate = Get-ChildItem `
            -LiteralPath $posterDirectory `
            -File `
            -ErrorAction SilentlyContinue |
            Where-Object {
                $_.Extension.ToLowerInvariant() -in @(
                    ".png",
                    ".jpg",
                    ".jpeg",
                    ".webp"
                )
            } |
            Select-Object -First 1

        if ($candidate) {
            $PosterPath = $candidate.FullName
        }
        else {
            throw "No poster image was found in public\posters. Pass -PosterPath explicitly."
        }
    }
}

$PosterPath = (Resolve-Path -LiteralPath $PosterPath).Path

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $root "install-intern-slider-and-poster.ps1.backup-$timestamp"

Copy-Item `
    -LiteralPath $installerPath `
    -Destination $backupPath `
    -Force

$utf8 = New-Object System.Text.UTF8Encoding($false)

$content = [System.IO.File]::ReadAllText(
    $installerPath,
    [System.Text.Encoding]::UTF8
)

$oldBlock = @'
Copy-Item `
    -LiteralPath $resolvedPosterPath `
    -Destination $posterDestination `
    -Force
'@

$newBlock = @'
$sourceFullPath = [System.IO.Path]::GetFullPath(
    $resolvedPosterPath
)

$destinationFullPath = [System.IO.Path]::GetFullPath(
    $posterDestination
)

if (
    -not [System.StringComparer]::OrdinalIgnoreCase.Equals(
        $sourceFullPath,
        $destinationFullPath
    )
) {
    Copy-Item `
        -LiteralPath $resolvedPosterPath `
        -Destination $posterDestination `
        -Force
}
else {
    Write-Host "Poster is already in public\posters; copy skipped." -ForegroundColor Yellow
}
'@

if ($content.Contains($oldBlock)) {
    $content = $content.Replace($oldBlock, $newBlock)
}
elseif (
    $content.Contains(
        "Poster is already in public\posters; copy skipped."
    )
) {
    Write-Host "Installer is already patched." -ForegroundColor Yellow
}
else {
    throw "Could not find the poster Copy-Item block in the installer."
}

[System.IO.File]::WriteAllText(
    $installerPath,
    $content,
    $utf8
)

Write-Host ""
Write-Host "Fixed same-file poster copy handling." -ForegroundColor Green
Write-Host "Installer backup:" -ForegroundColor Cyan
Write-Host "  $backupPath"
Write-Host ""
Write-Host "Re-running installer with poster:" -ForegroundColor Yellow
Write-Host "  $PosterPath"
Write-Host ""

powershell -ExecutionPolicy Bypass `
    -File $installerPath `
    -PosterPath $PosterPath

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "The installer still failed." -ForegroundColor Red
    Write-Host "Installer backup:" -ForegroundColor Yellow
    Write-Host "  $backupPath"
    exit 1
}

Write-Host ""
Write-Host "INTERN SLIDER AND POSTER INSTALLATION COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "Start the site with:" -ForegroundColor Cyan
Write-Host "  npm.cmd run dev"

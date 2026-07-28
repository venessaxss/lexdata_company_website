$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$pagePath = Join-Path $root "app\manager\course-registrations\[courseId]\page.tsx"

if (-not (Test-Path -LiteralPath $pagePath)) {
    throw "Cannot find app\manager\course-registrations\[courseId]\page.tsx. Run this script from the project root."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\course-registration-view-$timestamp"
$backupPath = Join-Path $backupRoot "app\manager\course-registrations\[courseId]\page.tsx"

New-Item -ItemType Directory `
    -Path (Split-Path -Parent $backupPath) `
    -Force |
    Out-Null

Copy-Item `
    -LiteralPath $pagePath `
    -Destination $backupPath `
    -Force

$utf8 = New-Object System.Text.UTF8Encoding($false)

$content = [System.IO.File]::ReadAllText(
    $pagePath,
    [System.Text.Encoding]::UTF8
)

$before = $content

# The site's global header styles are intended for the fixed navbar.
# Do not use a semantic <header> inside this admin workspace.
$content = [regex]::Replace(
    $content,
    '<header className="([^"]+)">',
    '<section className="$1">',
    1
)

$content = [regex]::Replace(
    $content,
    '</header>',
    '</section>',
    1
)

# Tighten the workspace dimensions.
$content = $content.Replace(
    'style={{ paddingTop: "128px" }}',
    'style={{ paddingTop: "112px" }}'
)

$content = $content.Replace(
    'max-w-[1480px]',
    'max-w-[1320px]'
)

$content = $content.Replace(
    'rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8',
    'rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7'
)

$content = $content.Replace(
    'text-3xl font-black leading-tight text-slate-950 sm:text-4xl',
    'text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl'
)

$content = $content.Replace(
    'grid gap-3 sm:grid-cols-4',
    'grid gap-3 sm:grid-cols-2 xl:grid-cols-4'
)

$content = $content.Replace(
    'rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm',
    'rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm'
)

$content = $content.Replace(
    'rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center',
    'rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm'
)

if ($content -eq $before) {
    throw "No expected course registration layout patterns were found. No changes were written."
}

[System.IO.File]::WriteAllText(
    $pagePath,
    $content,
    $utf8
)

Remove-Item `
    -LiteralPath (Join-Path $root ".next") `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

$packageJson = Get-Content `
    -LiteralPath (Join-Path $root "package.json") `
    -Raw |
    ConvertFrom-Json

$scripts = $packageJson.scripts

Write-Host ""
Write-Host "Course registration workspace layout fixed." -ForegroundColor Green
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""
Write-Host "Running TypeScript validation..." -ForegroundColor Yellow

if (
    $null -ne $scripts -and
    $scripts.PSObject.Properties.Name -contains "typecheck"
) {
    npm.cmd run typecheck
}
else {
    npx.cmd tsc --noEmit
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "TypeScript validation failed." -ForegroundColor Red
    Write-Host "Backup:" -ForegroundColor Yellow
    Write-Host "  $backupRoot"
    exit 1
}

Write-Host ""
Write-Host "TypeScript validation passed." -ForegroundColor Green

if (
    $null -ne $scripts -and
    $scripts.PSObject.Properties.Name -contains "build"
) {
    Write-Host ""
    Write-Host "Running production build..." -ForegroundColor Yellow

    npm.cmd run build

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Production build failed." -ForegroundColor Red
        Write-Host "Backup:" -ForegroundColor Yellow
        Write-Host "  $backupRoot"
        exit 1
    }
}

Write-Host ""
Write-Host "COURSE REGISTRATION VIEW FIX COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "Start the site with:" -ForegroundColor Cyan
Write-Host "  npm.cmd run dev"

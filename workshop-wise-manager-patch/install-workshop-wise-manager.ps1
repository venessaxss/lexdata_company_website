$ErrorActionPreference = "Stop"

$patchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$payloadRoot = Join-Path $patchRoot "payload"
$projectRoot = (Get-Location).Path

$required = @(
    "package.json",
    "app\admin\workshops\actions.ts",
    "lib\auth.ts",
    "lib\supabase\admin.ts"
)

foreach ($relative in $required) {
    $path = Join-Path $projectRoot $relative
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Cannot find required project file: $path`nRun this installer from the LexData project root."
    }
}

if (-not (Test-Path -LiteralPath $payloadRoot)) {
    throw "Cannot find patch payload: $payloadRoot"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $projectRoot "_backups\workshop-wise-$timestamp"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$targets = @(
    "app\admin\workshops\page.tsx",
    "app\admin\workshops\[id]\actions.ts",
    "app\admin\workshops\[id]\page.tsx",
    "app\admin\workshops\[id]\edit\page.tsx"
)

foreach ($relative in $targets) {
    $target = Join-Path $projectRoot $relative

    if (Test-Path -LiteralPath $target) {
        $safeName = ($relative -replace '[\\/:*?"<>|\[\]]', '_') + ".backup.txt"
        Copy-Item -LiteralPath $target -Destination (Join-Path $backupRoot $safeName) -Force
    }

    $source = Join-Path $payloadRoot $relative
    if (-not (Test-Path -LiteralPath $source)) {
        throw "Missing patch file: $source"
    }

    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $target -Force
    Write-Host "Installed: $relative" -ForegroundColor Green
}

# Remove copied TypeScript payload so the project compiler does not scan duplicate source files.
Remove-Item -LiteralPath $payloadRoot -Recurse -Force -ErrorAction SilentlyContinue

Remove-Item -LiteralPath (Join-Path $projectRoot ".next") -Recurse -Force -ErrorAction SilentlyContinue

$packageJson = Get-Content -LiteralPath (Join-Path $projectRoot "package.json") -Raw | ConvertFrom-Json
$scripts = $packageJson.scripts

Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""
Write-Host "Running TypeScript validation..." -ForegroundColor Yellow

if ($null -ne $scripts -and $scripts.PSObject.Properties.Name -contains "typecheck") {
    npm.cmd run typecheck
}
else {
    npx.cmd tsc --noEmit
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "TypeScript validation failed." -ForegroundColor Red
    Write-Host "Backup: $backupRoot" -ForegroundColor Yellow
    exit 1
}

Write-Host "TypeScript validation passed." -ForegroundColor Green

if ($null -ne $scripts -and $scripts.PSObject.Properties.Name -contains "build") {
    Write-Host ""
    Write-Host "Running production build..." -ForegroundColor Yellow
    npm.cmd run build

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Production build failed." -ForegroundColor Red
        Write-Host "Backup: $backupRoot" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "WORKSHOP-WISE MANAGEMENT INSTALLED" -ForegroundColor Green
Write-Host ""
Write-Host "Workshop library:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/admin/workshops"
Write-Host ""
Write-Host "Each Manage this workshop button now opens one dedicated workspace." -ForegroundColor Cyan
Write-Host ""
Write-Host "Start the app:" -ForegroundColor Yellow
Write-Host "  npm.cmd run dev"

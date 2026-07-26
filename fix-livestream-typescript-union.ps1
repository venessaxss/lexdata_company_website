$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\livestream-typefix-$timestamp"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$utf8 = New-Object System.Text.UTF8Encoding($false)

$routeFiles = @(
    "app\api\livestream\[streamId]\access\route.ts",
    "app\api\livestream\[streamId]\chat\route.ts",
    "app\api\livestream\[streamId]\heartbeat\route.ts",
    "app\api\livestream\[streamId]\token\route.ts"
)

foreach ($relativePath in $routeFiles) {
    $path = Join-Path $root $relativePath

    if (-not (Test-Path -LiteralPath $path)) {
        throw "Cannot find required route file: $path"
    }

    $backupPath = Join-Path $backupRoot $relativePath
    New-Item -ItemType Directory -Path (Split-Path -Parent $backupPath) -Force | Out-Null
    Copy-Item -LiteralPath $path -Destination $backupPath -Force

    $content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    $content = $content.Replace('if (!access.ok) {', 'if ("error" in access) {')
    [System.IO.File]::WriteAllText($path, $content, $utf8)

    Write-Host "Fixed: $relativePath" -ForegroundColor Green
}

$installerFolder = Join-Path $root "lexdata-registered-livestream-module"

if (Test-Path -LiteralPath $installerFolder) {
    $installerBackupZip = Join-Path $backupRoot "lexdata-registered-livestream-module.zip"

    Compress-Archive `
        -LiteralPath $installerFolder `
        -DestinationPath $installerBackupZip `
        -Force

    Remove-Item -LiteralPath $installerFolder -Recurse -Force

    Write-Host "Removed duplicate installer source folder." -ForegroundColor Green
    Write-Host "Archived copy: $installerBackupZip" -ForegroundColor Cyan
}

Remove-Item -LiteralPath (Join-Path $root ".next") -Recurse -Force -ErrorAction SilentlyContinue

$packageJson = Get-Content -LiteralPath (Join-Path $root "package.json") -Raw | ConvertFrom-Json
$scripts = $packageJson.scripts

Write-Host ""
Write-Host "Running TypeScript validation..." -ForegroundColor Yellow

if ($null -ne $scripts -and $scripts.PSObject.Properties.Name -contains "typecheck") {
    npm.cmd run typecheck
}
elseif (Test-Path -LiteralPath (Join-Path $root "tsconfig.json")) {
    npx.cmd tsc --noEmit
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript validation failed. Backup: $backupRoot" -ForegroundColor Red
    exit 1
}

Write-Host "TypeScript validation passed." -ForegroundColor Green

if ($null -ne $scripts -and $scripts.PSObject.Properties.Name -contains "build") {
    Write-Host ""
    Write-Host "Running production build..." -ForegroundColor Yellow
    npm.cmd run build

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed. Backup: $backupRoot" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "LIVESTREAM TYPESCRIPT FIX COMPLETE" -ForegroundColor Green
Write-Host "Run: npm.cmd run dev" -ForegroundColor Cyan

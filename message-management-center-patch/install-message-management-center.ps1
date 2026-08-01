$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$payloadRoot = Join-Path $PSScriptRoot "payload"

$required = @(
    "package.json",
    "app\dashboard\messages\page.tsx",
    "app\dashboard\messages\actions.ts"
)

foreach ($relative in $required) {
    $path = Join-Path $root $relative

    if (-not (Test-Path -LiteralPath $path)) {
        throw "Cannot find required file: $path`nRun this script from the project root."
    }
}

if (-not (Test-Path -LiteralPath $payloadRoot)) {
    throw "Patch payload is missing: $payloadRoot"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\message-center-management-$timestamp"
$utf8 = New-Object System.Text.UTF8Encoding($false)

$files = @(
    "app\dashboard\messages\page.tsx",
    "app\dashboard\messages\actions.ts",
    "components\messages\MessageBulkToolbar.tsx"
)

foreach ($relative in $files) {
    $source = Join-Path $payloadRoot $relative
    $destination = Join-Path $root $relative

    if (-not (Test-Path -LiteralPath $source)) {
        throw "Missing payload file: $source"
    }

    if (Test-Path -LiteralPath $destination) {
        $backup = Join-Path $backupRoot $relative
        New-Item -ItemType Directory -Path (Split-Path -Parent $backup) -Force | Out-Null
        Copy-Item -LiteralPath $destination -Destination $backup -Force
    }

    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    $content = [System.IO.File]::ReadAllText($source, [System.Text.Encoding]::UTF8)
    [System.IO.File]::WriteAllText($destination, $content, $utf8)

    Write-Host "Installed: $relative" -ForegroundColor Green
}

$tsconfigPath = Join-Path $root "tsconfig.json"

if (Test-Path -LiteralPath $tsconfigPath) {
    $tempScript = Join-Path $env:TEMP "message-center-tsconfig-$timestamp.cjs"

    $nodeScript = @'
const fs = require("fs");
const path = require("path");
const root = process.cwd();
const file = path.join(root, "tsconfig.json");
const ts = require(require.resolve("typescript", { paths: [root] }));
const source = fs.readFileSync(file, "utf8");
const parsed = ts.parseConfigFileTextToJson(file, source);

if (parsed.error) {
  throw new Error(
    ts.flattenDiagnosticMessageText(parsed.error.messageText, "\n")
  );
}

const config = parsed.config || {};
const current = Array.isArray(config.exclude) ? config.exclude : [];

config.exclude = Array.from(new Set([
  ...current,
  "node_modules",
  ".next",
  "_backups",
  "**/*.backup-*"
]));

fs.writeFileSync(
  file,
  JSON.stringify(config, null, 2) + "\n",
  "utf8"
);
'@

    [System.IO.File]::WriteAllText($tempScript, $nodeScript, $utf8)

    try {
        node $tempScript

        if ($LASTEXITCODE -ne 0) {
            throw "Could not update tsconfig.json."
        }
    }
    finally {
        Remove-Item -LiteralPath $tempScript -Force -ErrorAction SilentlyContinue
    }
}

Remove-Item -LiteralPath $payloadRoot -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $root ".next") -Recurse -Force -ErrorAction SilentlyContinue

$packageJson = Get-Content -LiteralPath (Join-Path $root "package.json") -Raw | ConvertFrom-Json
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

Write-Host ""
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
Write-Host "MESSAGE MANAGEMENT CENTER COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "Added:" -ForegroundColor Cyan
Write-Host "  - sender name, email, role, and account ID"
Write-Host "  - select page and clear selection"
Write-Host "  - bulk mark read"
Write-Host "  - bulk mark unread"
Write-Host "  - bulk delete"
Write-Host "  - individual read/unread and delete"
Write-Host "  - all, unread, and read counters"
Write-Host "  - collapsible reply forms"
Write-Host ""
Write-Host "No Supabase migration is required." -ForegroundColor Yellow
Write-Host ""
Write-Host "Start the site with:" -ForegroundColor Cyan
Write-Host "  npm.cmd run dev"

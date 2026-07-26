$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$tsconfigPath = Join-Path $root "tsconfig.json"

if (-not (Test-Path -LiteralPath $tsconfigPath)) {
    throw "Cannot find tsconfig.json. Run this script from the project root."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $root "tsconfig.json.backup-$timestamp"
Copy-Item -LiteralPath $tsconfigPath -Destination $backupPath -Force

$tempScript = Join-Path $env:TEMP "fix-lexdata-tsconfig-excludes-$timestamp.cjs"

$nodeScript = @'
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const tsconfigPath = path.join(root, "tsconfig.json");
const ts = require(require.resolve("typescript", { paths: [root] }));

const source = fs.readFileSync(tsconfigPath, "utf8");
const parsed = ts.parseConfigFileTextToJson(tsconfigPath, source);

if (parsed.error) {
  const message = ts.flattenDiagnosticMessageText(
    parsed.error.messageText,
    "\n"
  );
  throw new Error(`Could not parse tsconfig.json: ${message}`);
}

const config = parsed.config || {};
const currentExclude = Array.isArray(config.exclude)
  ? config.exclude
  : [];

const requiredExcludes = [
  "node_modules",
  ".next",
  "_backups",
  "lexdata-registered-livestream-module",
  "**/*.backup-*"
];

config.exclude = Array.from(
  new Set([...currentExclude, ...requiredExcludes])
);

fs.writeFileSync(
  tsconfigPath,
  JSON.stringify(config, null, 2) + "\n",
  "utf8"
);

console.log("Updated tsconfig.json exclude:");
for (const item of config.exclude) {
  console.log(`  - ${item}`);
}
'@

[System.IO.File]::WriteAllText(
    $tempScript,
    $nodeScript,
    (New-Object System.Text.UTF8Encoding($false))
)

try {
    node $tempScript

    if ($LASTEXITCODE -ne 0) {
        throw "Could not update tsconfig.json."
    }
}
finally {
    Remove-Item -LiteralPath $tempScript -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "tsconfig backup:" -ForegroundColor Cyan
Write-Host "  $backupPath"
Write-Host ""

Remove-Item -LiteralPath (Join-Path $root ".next") `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

$packageJsonPath = Join-Path $root "package.json"
$packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
$scripts = $packageJson.scripts

Write-Host "Running TypeScript validation..." -ForegroundColor Yellow

if ($null -ne $scripts -and $scripts.PSObject.Properties.Name -contains "typecheck") {
    npm.cmd run typecheck
}
elseif (Test-Path -LiteralPath (Join-Path $root "tsconfig.json")) {
    npx.cmd tsc --noEmit
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "TypeScript validation still failed." -ForegroundColor Red
    Write-Host "Restore tsconfig if necessary:" -ForegroundColor Yellow
    Write-Host "  Copy-Item `"$backupPath`" `"$tsconfigPath`" -Force"
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
        exit 1
    }
}

Write-Host ""
Write-Host "BACKUP SOURCE EXCLUSION FIX COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "TypeScript will no longer compile source files inside:" -ForegroundColor Cyan
Write-Host "  _backups"
Write-Host "  lexdata-registered-livestream-module"
Write-Host "  files matching **/*.backup-*"
Write-Host ""
Write-Host "Start the application with:" -ForegroundColor Yellow
Write-Host "  npm.cmd run dev"

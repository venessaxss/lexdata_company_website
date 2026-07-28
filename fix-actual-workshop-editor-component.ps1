$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$searchRoots = @(
    (Join-Path $root "app"),
    (Join-Path $root "components")
) | Where-Object { Test-Path -LiteralPath $_ }

if ($searchRoots.Count -eq 0) {
    throw "Cannot find app or components. Run this script from the project root."
}

$candidates = @()

foreach ($searchRoot in $searchRoots) {
    $files = Get-ChildItem `
        -LiteralPath $searchRoot `
        -Recurse `
        -File `
        -Include "*.tsx", "*.jsx"

    foreach ($file in $files) {
        $content = [System.IO.File]::ReadAllText(
            $file.FullName,
            [System.Text.Encoding]::UTF8
        )

        $score = 0

        if ($content.Contains("Workshop overview")) {
            $score += 3
        }

        if ($content.Contains("Recruitment and process")) {
            $score += 3
        }

        if ($content.Contains("Sessions and subsessions")) {
            $score += 4
        }

        if ($content.Contains("Add major session")) {
            $score += 2
        }

        if ($content.Contains("Detailed agenda")) {
            $score += 2
        }

        if ($content -match "sticky|grid-cols-\[.*minmax") {
            $score += 2
        }

        if ($score -ge 10) {
            $candidates += [PSCustomObject]@{
                Path = $file.FullName
                Score = $score
            }
        }
    }
}

if ($candidates.Count -eq 0) {
    throw @"
Could not locate the workshop editor component automatically.

Expected text:
  Workshop overview
  Recruitment and process
  Sessions and subsessions
  Add major session
"@
}

$target = $candidates |
    Sort-Object Score -Descending |
    Select-Object -First 1

$targetPath = $target.Path
$relativeTarget = $targetPath.Substring($root.Length).TrimStart("\", "/")

Write-Host ""
Write-Host "Located workshop editor:" -ForegroundColor Cyan
Write-Host "  $relativeTarget"
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\workshop-editor-component-$timestamp"
$backupPath = Join-Path $backupRoot $relativeTarget

New-Item -ItemType Directory `
    -Path (Split-Path -Parent $backupPath) `
    -Force |
    Out-Null

Copy-Item `
    -LiteralPath $targetPath `
    -Destination $backupPath `
    -Force

$utf8 = New-Object System.Text.UTF8Encoding($false)
$content = [System.IO.File]::ReadAllText(
    $targetPath,
    [System.Text.Encoding]::UTF8
)

$changes = 0

function Replace-FirstRegex {
    param(
        [string]$InputText,
        [string]$Pattern,
        [string]$Replacement,
        [ref]$Counter
    )

    $regex = New-Object System.Text.RegularExpressions.Regex(
        $Pattern,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    if ($regex.IsMatch($InputText)) {
        $Counter.Value += 1
        return $regex.Replace(
            $InputText,
            $Replacement,
            1
        )
    }

    return $InputText
}

# Guarantee space below the fixed site navigation.
$content = Replace-FirstRegex `
    -InputText $content `
    -Pattern '<main\s+className="[^"]*min-h-screen[^"]*"(?:\s+style=\{\{[^}]*\}\})?\s*>' `
    -Replacement '<main className="min-h-screen bg-[#f6f8fb] px-4 pb-16 sm:px-6 lg:px-8" style={{ paddingTop: "136px" }}>' `
    -Counter ([ref]$changes)

# Center and constrain the complete editor.
$content = Replace-FirstRegex `
    -InputText $content `
    -Pattern '(<main[^>]*>\s*)<div\s+className="mx-auto[^"]*">' `
    -Replacement '$1<div className="mx-auto w-full max-w-[1480px] space-y-6">' `
    -Counter ([ref]$changes)

# Remove the sidebar/schedule split and make the workspace vertical.
$content = Replace-FirstRegex `
    -InputText $content `
    -Pattern '<div\s+className="[^"]*(?:grid-cols-\[[^"]*minmax\(0,\s*1fr\)[^"]*\]|xl:grid-cols-\[[^"]+\])[^"]*">' `
    -Replacement '<div className="space-y-6">' `
    -Counter ([ref]$changes)

# Move the two settings panels above the schedule in a compact two-column row.
$content = Replace-FirstRegex `
    -InputText $content `
    -Pattern '<aside\s+className="[^"]*(?:sticky|self-start)[^"]*">' `
    -Replacement '<aside className="grid gap-4 lg:grid-cols-2">' `
    -Counter ([ref]$changes)

# A fallback for an aside without sticky but still used as a narrow column.
if ($content -match '<aside\s+className="space-y-[^"]*">') {
    $content = Replace-FirstRegex `
        -InputText $content `
        -Pattern '<aside\s+className="space-y-[^"]*">' `
        -Replacement '<aside className="grid gap-4 lg:grid-cols-2">' `
        -Counter ([ref]$changes)
}

# Make the schedule area use the available full width.
$content = [regex]::Replace(
    $content,
    '<section\s+id="schedule"\s+className="[^"]*">',
    '<section id="schedule" className="w-full space-y-4">'
)

# Make the workshop header responsive and prevent action clipping.
$content = $content.Replace(
    'lg:flex-row lg:items-end',
    'xl:flex-row xl:items-start'
)

$content = $content.Replace(
    'className="flex flex-wrap gap-2"',
    'className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap"'
)

# Compact oversized cards and make them consistent.
$content = $content.Replace(
    'rounded-[2rem]',
    'rounded-[26px]'
)

# Remove hard widths from add/edit panels.
$content = [regex]::Replace(
    $content,
    '\b(?:sm:|md:|lg:|xl:)?w-\[(?:280|330|390|420|460|520)px\]\b',
    'w-full'
)

$content = [regex]::Replace(
    $content,
    '\b(?:sm:|md:|lg:|xl:)?min-w-\[(?:280|330|390|420|460|520)px\]\b',
    'min-w-0'
)

# Keep header and schedule controls from forcing horizontal overflow.
$content = $content.Replace(
    'sm:flex-row sm:items-center',
    'xl:flex-row xl:items-start'
)

$content = $content.Replace(
    'grid grid-cols-3 gap-2',
    'grid gap-2 sm:grid-cols-3'
)

$content = $content.Replace(
    'className="space-y-5 p-5"',
    'className="space-y-4 p-4 sm:p-5"'
)

$content = $content.Replace(
    'className="border-b border-slate-200 bg-slate-50 p-5"',
    'className="border-b border-slate-200 bg-slate-50/80 p-4 sm:p-5"'
)

# Ensure the major-session heading and action buttons wrap cleanly.
$content = [regex]::Replace(
    $content,
    'className="flex\s+justify-between\s+gap-4"',
    'className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start"'
)

$content = [regex]::Replace(
    $content,
    'className="flex\s+items-start\s+justify-between\s+gap-4"',
    'className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"'
)

# Make subsession rows wrap rather than squeeze titles.
$content = $content.Replace(
    'className="flex items-start justify-between gap-3"',
    'className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"'
)

# Make long titles break instead of overflowing.
$content = $content.Replace(
    'text-2xl font-black text-slate-950',
    'text-xl font-black leading-tight text-slate-950 sm:text-2xl'
)

# Add a reliable minimum width rule to common flex/grid children.
$content = $content.Replace(
    'className="flex-1"',
    'className="min-w-0 flex-1"'
)

[System.IO.File]::WriteAllText(
    $targetPath,
    $content,
    $utf8
)

# Exclude backups from TypeScript.
$tsconfigPath = Join-Path $root "tsconfig.json"

if (Test-Path -LiteralPath $tsconfigPath) {
    $tempScript = Join-Path $env:TEMP "workshop-editor-tsconfig-$timestamp.cjs"

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

    [System.IO.File]::WriteAllText(
        $tempScript,
        $nodeScript,
        $utf8
    )

    try {
        node $tempScript

        if ($LASTEXITCODE -ne 0) {
            throw "Could not update tsconfig.json."
        }
    }
    finally {
        Remove-Item `
            -LiteralPath $tempScript `
            -Force `
            -ErrorAction SilentlyContinue
    }
}

Remove-Item `
    -LiteralPath (Join-Path $root ".next") `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

Write-Host "Layout replacements applied: $changes" -ForegroundColor Green
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""

$packageJson = Get-Content `
    -LiteralPath (Join-Path $root "package.json") `
    -Raw |
    ConvertFrom-Json

$scripts = $packageJson.scripts

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
Write-Host "WORKSHOP EDITOR COMPONENT FIX COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "Patched file:" -ForegroundColor Cyan
Write-Host "  $relativeTarget"
Write-Host ""
Write-Host "The editor now has:" -ForegroundColor Cyan
Write-Host "  - guaranteed spacing below the fixed navbar"
Write-Host "  - a full-width schedule workspace"
Write-Host "  - no narrow sticky sidebar"
Write-Host "  - overview and status panels above the schedule"
Write-Host "  - wrapping header and subsession controls"
Write-Host "  - no hard 330/390/420/520 pixel editor widths"
Write-Host ""
Write-Host "Start the site with:" -ForegroundColor Yellow
Write-Host "  npm.cmd run dev"

$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\fix-active-stamp-preview-$timestamp"

$componentPath = Join-Path $root "components\admin\ReceiptFormatEditor.tsx"
$adminPagePath = Join-Path $root "app\admin\documents\receipts\page.tsx"

foreach ($path in @($componentPath, $adminPagePath)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Cannot find required file: $path`nRun this script from the LexData project root."
    }
}

function Backup-File {
    param([string]$Path)

    $relative = $Path.Substring($root.Length).TrimStart("\", "/")
    $destination = Join-Path $backupRoot $relative

    New-Item -ItemType Directory `
        -Path (Split-Path -Parent $destination) `
        -Force | Out-Null

    Copy-Item `
        -LiteralPath $Path `
        -Destination $destination `
        -Force
}

function Read-Utf8 {
    param([string]$Path)

    return [System.IO.File]::ReadAllText(
        $Path,
        [System.Text.Encoding]::UTF8
    )
}

function Write-Utf8 {
    param(
        [string]$Path,
        [string]$Content
    )

    [System.IO.File]::WriteAllText(
        $Path,
        $Content,
        $utf8
    )
}

Backup-File $componentPath
Backup-File $adminPagePath

# ============================================================
# 1. ReceiptFormatEditor:
#    resolve stamp from props OR initial fallback
# ============================================================

$component = Read-Utf8 $componentPath

$oldShow = @'
  const showStamp =
    Boolean(stampEnabled) &&
    Boolean(stampUrl);
'@

$newShow = @'
  const resolvedStampUrl =
    stampUrl ||
    initial?.receipt_stamp_url ||
    null;

  const resolvedStampEnabled =
    stampEnabled === false ||
    initial?.receipt_stamp_enabled === false
      ? false
      : Boolean(resolvedStampUrl);

  const showStamp =
    resolvedStampEnabled &&
    Boolean(resolvedStampUrl);
'@

if ($component.Contains($oldShow)) {
    $component = $component.Replace(
        $oldShow,
        $newShow
    )

    Write-Host "[OK] Added robust stamp-state resolver to ReceiptFormatEditor." -ForegroundColor Green
}
elseif (-not $component.Contains("const resolvedStampUrl")) {
    $pattern = 'const\s+showStamp\s*=\s*Boolean\(stampEnabled\)\s*&&\s*Boolean\(stampUrl\)\s*;'

    $regex = [System.Text.RegularExpressions.Regex]::new(
        $pattern,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    if ($regex.IsMatch($component)) {
        $component = $regex.Replace(
            $component,
            $newShow.Trim(),
            1
        )
        Write-Host "[OK] Added robust stamp-state resolver using flexible match." -ForegroundColor Green
    }
    else {
        throw "Could not locate the showStamp calculation in ReceiptFormatEditor.tsx."
    }
}
else {
    Write-Host "[OK] Stamp resolver already exists." -ForegroundColor DarkGreen
}

# Use resolvedStampUrl in preview.
$component = $component.Replace(
    "showStamp && stampUrl ?",
    "showStamp && resolvedStampUrl ?"
)

$component = $component.Replace(
    "src={stampUrl}",
    "src={resolvedStampUrl}"
)

Write-Utf8 $componentPath $component

# ============================================================
# 2. Admin receipt page:
#    pass stamp through BOTH direct props and initial fallback
# ============================================================

$adminPage = Read-Utf8 $adminPagePath

# Ensure issuer select contains the stamp fields.
if (
    $adminPage.Contains(
        '"jurisdiction,legal_name,trading_name"'
    )
) {
    $adminPage = $adminPage.Replace(
        '"jurisdiction,legal_name,trading_name"',
        '"jurisdiction,legal_name,trading_name,receipt_stamp_url,receipt_stamp_enabled"'
    )
}

# Harden existing stampEnabled prop if present.
$simpleEnabledPattern =
    'stampEnabled=\{\s*issuer\?\.receipt_stamp_enabled\s*\}'

$enabledRegex = [System.Text.RegularExpressions.Regex]::new(
    $simpleEnabledPattern,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$enabledReplacement = @'
stampEnabled={
                      issuer?.receipt_stamp_enabled === false
                        ? false
                        : Boolean(issuer?.receipt_stamp_url)
                    }
'@

if ($enabledRegex.IsMatch($adminPage)) {
    $adminPage = $enabledRegex.Replace(
        $adminPage,
        $enabledReplacement,
        1
    )
    Write-Host "[OK] Hardened direct stampEnabled prop." -ForegroundColor Green
}

# If stamp props are missing entirely, inject them before initial.
if (-not $adminPage.Contains("stampUrl={")) {
    $initialPattern =
        'initial=\{formatByJurisdiction\.get\(\s*jurisdiction\s*\)\}'

    $initialRegex = [System.Text.RegularExpressions.Regex]::new(
        $initialPattern,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    if (-not $initialRegex.IsMatch($adminPage)) {
        throw "Could not locate ReceiptFormatEditor initial prop."
    }

    $inject = @'
stampUrl={
                      issuer?.receipt_stamp_url || null
                    }
                    stampEnabled={
                      issuer?.receipt_stamp_enabled === false
                        ? false
                        : Boolean(issuer?.receipt_stamp_url)
                    }
                    initial={formatByJurisdiction.get(
                      jurisdiction
                    )}
'@

    $adminPage = $initialRegex.Replace(
        $adminPage,
        $inject,
        1
    )

    Write-Host "[OK] Injected active issuer stamp props into ReceiptFormatEditor." -ForegroundColor Green
}

# Add issuer stamp fields into `initial` too, so preview has a fallback
# even if direct props become stale/undefined due local formatting changes.
$initialObjectAlready =
    $adminPage.Contains("receipt_stamp_url: issuer?.receipt_stamp_url")

if (-not $initialObjectAlready) {
    $initialPattern2 =
        'initial=\{formatByJurisdiction\.get\(\s*jurisdiction\s*\)\}'

    $initialRegex2 = [System.Text.RegularExpressions.Regex]::new(
        $initialPattern2,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    if ($initialRegex2.IsMatch($adminPage)) {
        $initialObject = @'
initial={{
                      ...(formatByJurisdiction.get(
                        jurisdiction
                      ) || {}),
                      receipt_stamp_url:
                        issuer?.receipt_stamp_url || null,
                      receipt_stamp_enabled:
                        issuer?.receipt_stamp_enabled === false
                          ? false
                          : Boolean(issuer?.receipt_stamp_url),
                    }}
'@

        $adminPage = $initialRegex2.Replace(
            $adminPage,
            $initialObject,
            1
        )

        Write-Host "[OK] Added issuer-stamp fallback to format initial data." -ForegroundColor Green
    }
}

Write-Utf8 $adminPagePath $adminPage

# ============================================================
# 3. Clear Next cache + typecheck
# ============================================================

Remove-Item `
    -LiteralPath (Join-Path $root ".next") `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Running typecheck..." -ForegroundColor Yellow

npm.cmd run typecheck

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[!] TypeScript still reports an error. Paste the exact output." -ForegroundColor Red
    Write-Host "Backup:" -ForegroundColor Yellow
    Write-Host "  $backupRoot"
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "ACTIVE STAMP PREVIEW STATE FIXED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""
Write-Host "Restart:" -ForegroundColor Yellow
Write-Host "  npm.cmd run dev"
Write-Host ""
Write-Host "Then hard refresh /admin/documents/receipts (Ctrl+F5)." -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected:" -ForegroundColor Cyan
Write-Host "  Active issuer stamp -> shown in Live Preview"
Write-Host "  Explicitly disabled stamp -> hidden"

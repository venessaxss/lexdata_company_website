$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\restore-china-receipt-jurisdiction-$timestamp"

$files = @(
    "app\manager\actions\payment-actions.ts",
    "app\manager\registrations\page.tsx",
    "app\dashboard\receipts\actions.ts",
    "app\dashboard\receipts\page.tsx",
    "app\admin\documents\receipts\actions.ts",
    "app\admin\documents\receipts\page.tsx"
)

foreach ($relative in $files) {
    $path = Join-Path $root $relative

    if (-not (Test-Path -LiteralPath $path)) {
        throw "Cannot find required file: $path`nRun this script from the LexData project root."
    }
}

function Backup-File {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    $relative = $Path.Substring($root.Length).TrimStart("\", "/")
    $destination = Join-Path $backupRoot $relative

    New-Item -ItemType Directory `
        -Path (Split-Path -Parent $destination) `
        -Force |
        Out-Null

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

function Replace-LiteralAll {
    param(
        [string]$Content,
        [string]$Old,
        [string]$New,
        [string]$Label
    )

    if ($Content.Contains($Old)) {
        $updated = $Content.Replace($Old, $New)
        Write-Host "[OK] $Label" -ForegroundColor Green
        return $updated
    }

    if ($Content.Contains($New)) {
        Write-Host "[OK] Already restored: $Label" -ForegroundColor DarkGreen
        return $Content
    }

    Write-Host "[!] Pattern not found: $Label" -ForegroundColor Yellow
    return $Content
}

# ============================================================
# 1. Manager payment action:
#    keep issuer authoritative, but restore CN
# ============================================================

$path = Join-Path $root "app\manager\actions\payment-actions.ts"
Backup-File $path
$content = Read-Utf8 $path

$content = Replace-LiteralAll `
    $content `
    '["PK", "SA"].includes(requestedJurisdiction)' `
    '["PK", "SA", "CN"].includes(requestedJurisdiction)' `
    "manager payment jurisdiction whitelist"

Write-Utf8 $path $content

# ============================================================
# 2. Manager registration UI:
#    restore China in document_jurisdiction selector
# ============================================================

$path = Join-Path $root "app\manager\registrations\page.tsx"
Backup-File $path
$content = Read-Utf8 $path

$selectPattern = '<select\b(?=[^>]*\bname=["'']document_jurisdiction["''])[^>]*>.*?</select>'
$selectRegex = [System.Text.RegularExpressions.Regex]::new(
    $selectPattern,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$match = $selectRegex.Match($content)

if (-not $match.Success) {
    throw "Could not locate <select name=`"document_jurisdiction`"> in manager registrations page."
}

$select = $match.Value

if ($select -notmatch 'value=["'']CN["'']') {
    $saPattern = '(<option\s+value=["'']SA["''][^>]*>\s*Saudi Arabia\s*</option>)'
    $saRegex = [System.Text.RegularExpressions.Regex]::new(
        $saPattern,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    if (-not $saRegex.IsMatch($select)) {
        throw "Could not locate Saudi Arabia option inside document_jurisdiction selector."
    }

    $select = $saRegex.Replace(
        $select,
@'
$1
                                  <option value="CN">China</option>
'@,
        1
    )

    $before = $content.Substring(0, $match.Index)
    $after = $content.Substring($match.Index + $match.Length)
    $content = $before + $select + $after

    Write-Host "[OK] Restored China in manager receipt issuing entity selector." -ForegroundColor Green
}
else {
    Write-Host "[OK] China already exists in manager issuer selector." -ForegroundColor DarkGreen
}

$content = $content.Replace(
    "This issuer is inherited by the participant&apos;s receipt application. Change it here before confirming payment if needed.",
    "This issuer is inherited by the participant&apos;s receipt application. Choose Pakistan, Saudi Arabia, or China before confirming payment."
)

Write-Utf8 $path $content

# ============================================================
# 3. Participant receipt application action:
#    registration issuer remains authoritative, CN allowed
# ============================================================

$path = Join-Path $root "app\dashboard\receipts\actions.ts"
Backup-File $path
$content = Read-Utf8 $path

$content = Replace-LiteralAll `
    $content `
    '!["PK", "SA"].includes(jurisdiction)' `
    '!["PK", "SA", "CN"].includes(jurisdiction)' `
    "participant receipt jurisdiction validation"

$content = $content.Replace(
    "The receipt issuing entity is not configured as Pakistan or Saudi Arabia. Ask the manager to correct the registration issuer.",
    "The receipt issuing entity is not configured as Pakistan, Saudi Arabia, or China. Ask the manager to correct the registration issuer."
)

Write-Utf8 $path $content

# ============================================================
# 4. Participant receipt page:
#    load/show CN issuer read-only
# ============================================================

$path = Join-Path $root "app\dashboard\receipts\page.tsx"
Backup-File $path
$content = Read-Utf8 $path

$content = Replace-LiteralAll `
    $content `
    '.in("jurisdiction", ["PK", "SA"])' `
    '.in("jurisdiction", ["PK", "SA", "CN"])' `
    "participant issuer-profile query"

$content = Replace-LiteralAll `
    $content `
    '["PK", "SA"].includes(registrationJurisdiction)' `
    '["PK", "SA", "CN"].includes(registrationJurisdiction)' `
    "participant issuer availability"

$content = $content.Replace(
    "for the Pakistan or Saudi Arabia issuing entity.",
    "for the Pakistan, Saudi Arabia, or China issuing entity."
)

$content = $content.Replace(
    "Issuer unavailable. Ask the manager to set Pakistan or Saudi Arabia on this registration.",
    "Issuer unavailable. Ask the manager to set Pakistan, Saudi Arabia, or China on this registration."
)

Write-Utf8 $path $content

# ============================================================
# 5. Admin receipt approval:
#    re-check authoritative registration issuer, including CN
# ============================================================

$path = Join-Path $root "app\admin\documents\receipts\actions.ts"
Backup-File $path
$content = Read-Utf8 $path

$content = Replace-LiteralAll `
    $content `
    '!["PK", "SA"].includes(registrationJurisdiction)' `
    '!["PK", "SA", "CN"].includes(registrationJurisdiction)' `
    "admin final issuer validation"

$content = $content.Replace(
    "The source registration does not have a valid Pakistan or Saudi Arabia receipt issuer.",
    "The source registration does not have a valid Pakistan, Saudi Arabia, or China receipt issuer."
)

Write-Utf8 $path $content

# ============================================================
# 6. Admin receipt management:
#    restore China format/issuer workspace
# ============================================================

$path = Join-Path $root "app\admin\documents\receipts\page.tsx"
Backup-File $path
$content = Read-Utf8 $path

$content = Replace-LiteralAll `
    $content `
    'const jurisdictions = ["PK", "SA"] as const;' `
    'const jurisdictions = ["PK", "SA", "CN"] as const;' `
    "admin receipt format jurisdictions"

$content = Replace-LiteralAll `
    $content `
    '.in("jurisdiction", ["PK", "SA"])' `
    '.in("jurisdiction", ["PK", "SA", "CN"])' `
    "admin receipt issuer/format queries"

$content = $content.Replace(
    "FBR / ZATCA authority reference",
    "FBR / ZATCA / China tax authority reference"
)

$content = $content.Replace(
    "Pakistan + Saudi receipt system",
    "Pakistan + Saudi Arabia + China receipt system"
)

Write-Utf8 $path $content

# ============================================================
# 7. Database migration:
#    receipt_applications constraint must accept CN
# ============================================================

$migrationPath = Join-Path $root "supabase\migrations\20260822_restore_china_receipt_jurisdiction.sql"
Backup-File $migrationPath

$migration = @'
begin;

alter table public.receipt_applications
drop constraint if exists receipt_applications_jurisdiction_check;

alter table public.receipt_applications
add constraint receipt_applications_jurisdiction_check
check (jurisdiction in ('PK', 'SA', 'CN'));

notify pgrst, 'reload schema';

commit;
'@

New-Item -ItemType Directory `
    -Path (Split-Path -Parent $migrationPath) `
    -Force |
    Out-Null

Write-Utf8 $migrationPath $migration
Write-Host "[OK] Created CN receipt-application database migration." -ForegroundColor Green

# ============================================================
# 8. Clear Next cache + typecheck
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
Write-Host "CHINA RECEIPT JURISDICTION RESTORED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""
Write-Host "REQUIRED SUPABASE STEP:" -ForegroundColor Yellow
Write-Host "Run in Supabase SQL Editor:"
Write-Host "  supabase\migrations\20260822_restore_china_receipt_jurisdiction.sql"
Write-Host ""
Write-Host "Then run:" -ForegroundColor Cyan
Write-Host "  npm.cmd run build"
Write-Host "  npm.cmd run dev"
Write-Host ""
Write-Host "Restored issuer choices:" -ForegroundColor Cyan
Write-Host "  Pakistan (PK)"
Write-Host "  Saudi Arabia (SA)"
Write-Host "  China (CN)"
Write-Host ""
Write-Host "Synchronization remains enforced:" -ForegroundColor Cyan
Write-Host "  Manager chooses issuer on registration."
Write-Host "  Participant sees that issuer read-only."
Write-Host "  Receipt application stores that issuer."
Write-Host "  Admin issuance re-checks it against the registration."

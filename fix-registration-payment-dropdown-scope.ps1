$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$path = Join-Path $root "app\manager\registrations\page.tsx"

if (-not (Test-Path -LiteralPath $path)) {
    throw "Cannot find: $path`nRun this script from the LexData project root."
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $root "_backups\fix-registration-payment-dropdown-$timestamp\app\manager\registrations\page.tsx"

New-Item -ItemType Directory `
    -Path (Split-Path -Parent $backup) `
    -Force |
    Out-Null

Copy-Item `
    -LiteralPath $path `
    -Destination $backup `
    -Force

$content = [System.IO.File]::ReadAllText(
    $path,
    [System.Text.Encoding]::UTF8
)

# Find the beginning of the per-registration rendering scope.
$scopePatterns = @(
    'registrations\.map\(\s*\(\s*registration\b',
    'registrations\.map\(\s*registration\b',
    '\.map\(\s*\(\s*registration\b'
)

$scopeStart = -1

foreach ($pattern in $scopePatterns) {
    $regex = [System.Text.RegularExpressions.Regex]::new(
        $pattern,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    $match = $regex.Match($content)

    if ($match.Success) {
        $scopeStart = $match.Index
        break
    }
}

if ($scopeStart -lt 0) {
    throw "Could not locate the per-registration .map(...) scope."
}

$prefix = $content.Substring(0, $scopeStart)
$suffix = $content.Substring($scopeStart)

# ------------------------------------------------------------
# Repair conditionals accidentally injected into page-level
# filters before `registration` exists.
# ------------------------------------------------------------

$badConfirmedPattern = @'
\{\s*registration\.payment_status\s*===\s*["']confirmed["']\s*\?\s*\(\s*<option\s+value=["']confirmed["'][^>]*>\s*Confirmed\s+Paid\s*</option>\s*\)\s*:\s*null\s*\}
'@

$badWaivedPattern = @'
\{\s*registration\.payment_status\s*===\s*["']waived["']\s*\?\s*\(\s*<option\s+value=["']waived["'][^>]*>\s*Waived\s*</option>\s*\)\s*:\s*null\s*\}
'@

$confirmedRegex = [System.Text.RegularExpressions.Regex]::new(
    $badConfirmedPattern,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$waivedRegex = [System.Text.RegularExpressions.Regex]::new(
    $badWaivedPattern,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$confirmedRepairs = $confirmedRegex.Matches($prefix).Count
$waivedRepairs = $waivedRegex.Matches($prefix).Count

$prefix = $confirmedRegex.Replace(
    $prefix,
    '<option value="confirmed">Confirmed Paid</option>'
)

$prefix = $waivedRegex.Replace(
    $prefix,
    '<option value="waived">Waived</option>'
)

Write-Host "[OK] Repaired page-level Confirmed conditionals: $confirmedRepairs" -ForegroundColor Green
Write-Host "[OK] Repaired page-level Waived conditionals: $waivedRepairs" -ForegroundColor Green

# ------------------------------------------------------------
# Inside the registration row, locate the payment_status select
# and make Confirmed/Waived non-transition choices.
# Existing confirmed/waived records still display correctly.
# ------------------------------------------------------------

$paymentSelectPattern = @'
<select\b(?=[^>]*\bname=["']payment_status["'])[^>]*>(.*?)</select>
'@

$paymentSelectRegex = [System.Text.RegularExpressions.Regex]::new(
    $paymentSelectPattern,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$selectMatch = $paymentSelectRegex.Match($suffix)

if ($selectMatch.Success) {
    $wholeSelect = $selectMatch.Value
    $updatedSelect = $wholeSelect

    if (
        -not $updatedSelect.Contains(
            'registration.payment_status === "confirmed"'
        )
    ) {
        $plainConfirmedRegex = [System.Text.RegularExpressions.Regex]::new(
            '<option\s+value=["'']confirmed["''][^>]*>\s*Confirmed\s+Paid\s*</option>',
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )

        if ($plainConfirmedRegex.IsMatch($updatedSelect)) {
            $updatedSelect = $plainConfirmedRegex.Replace(
                $updatedSelect,
@'
{registration.payment_status === "confirmed" ? (
                                      <option value="confirmed">
                                        Confirmed Paid
                                      </option>
                                    ) : null}
'@,
                1
            )

            Write-Host "[OK] Row dropdown: Confirmed Paid is now display-only for already confirmed rows." -ForegroundColor Green
        }
        else {
            Write-Host "[!] Row payment dropdown has no plain Confirmed Paid option to patch." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "[OK] Row Confirmed Paid option is already conditional." -ForegroundColor DarkGreen
    }

    if (
        -not $updatedSelect.Contains(
            'registration.payment_status === "waived"'
        )
    ) {
        $plainWaivedRegex = [System.Text.RegularExpressions.Regex]::new(
            '<option\s+value=["'']waived["''][^>]*>\s*Waived\s*</option>',
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )

        if ($plainWaivedRegex.IsMatch($updatedSelect)) {
            $updatedSelect = $plainWaivedRegex.Replace(
                $updatedSelect,
@'
{registration.payment_status === "waived" ? (
                                      <option value="waived">
                                        Waived
                                      </option>
                                    ) : null}
'@,
                1
            )

            Write-Host "[OK] Row dropdown: Waived is now display-only for already waived rows." -ForegroundColor Green
        }
        else {
            Write-Host "[!] Row payment dropdown has no plain Waived option to patch." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "[OK] Row Waived option is already conditional." -ForegroundColor DarkGreen
    }

    if ($updatedSelect -ne $wholeSelect) {
        $before = $suffix.Substring(0, $selectMatch.Index)
        $afterStart = $selectMatch.Index + $selectMatch.Length
        $after = $suffix.Substring($afterStart)

        $suffix = $before + $updatedSelect + $after
    }
}
else {
    Write-Host "[!] Could not locate a row <select name=`"payment_status`">." -ForegroundColor Yellow
    Write-Host "    Server-side transition protection remains active." -ForegroundColor Yellow
}

$content = $prefix + $suffix

[System.IO.File]::WriteAllText(
    $path,
    $content,
    $utf8
)

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
    Write-Host "  $backup"
    exit 1
}

Write-Host ""
Write-Host "[OK] Registration payment dropdown repair passed TypeScript." -ForegroundColor Green
Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backup"
Write-Host ""
Write-Host "If you have not run it yet, also run this migration in Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host "  supabase\migrations\20260821_harden_workshop_payment_receipt_sync.sql"

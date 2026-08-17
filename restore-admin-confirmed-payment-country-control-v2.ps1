$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\restore-admin-payment-country-v2-$timestamp"

$pagePath = Join-Path $root "app\manager\registrations\page.tsx"
$actionsPath = Join-Path $root "app\manager\actions\payment-actions.ts"

foreach ($path in @($pagePath, $actionsPath)) {
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

Backup-File $pagePath
Backup-File $actionsPath

# ============================================================
# 1. Registration page: restore Confirmed Paid + Waived
#    in the per-registration payment dropdown
# ============================================================

$page = Read-Utf8 $pagePath

$confirmedConditionalPattern = @'
\{\s*registration\.payment_status\s*===\s*"confirmed"\s*\?\s*\(\s*
<option\s+value="confirmed">\s*
Confirmed\s+Paid\s*
</option>\s*
\)\s*:\s*null\s*\}
'@

$confirmedRegex = [System.Text.RegularExpressions.Regex]::new(
    $confirmedConditionalPattern,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

if ($confirmedRegex.IsMatch($page)) {
    $page = $confirmedRegex.Replace(
        $page,
@'
<option value="confirmed">
                                      Confirmed Paid
                                    </option>
'@,
        1
    )

    Write-Host "[OK] Restored Confirmed Paid in management dropdown." -ForegroundColor Green
}
else {
    Write-Host "[OK] Confirmed Paid is already unconditional or locally reformatted." -ForegroundColor DarkGreen
}

$waivedConditionalPattern = @'
\{\s*registration\.payment_status\s*===\s*"waived"\s*\?\s*\(\s*
<option\s+value="waived">\s*
Waived\s*
</option>\s*
\)\s*:\s*null\s*\}
'@

$waivedRegex = [System.Text.RegularExpressions.Regex]::new(
    $waivedConditionalPattern,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

if ($waivedRegex.IsMatch($page)) {
    $page = $waivedRegex.Replace(
        $page,
@'
<option value="waived">
                                      Waived
                                    </option>
'@,
        1
    )

    Write-Host "[OK] Restored Waived in management dropdown." -ForegroundColor Green
}
else {
    Write-Host "[OK] Waived is already unconditional or locally reformatted." -ForegroundColor DarkGreen
}

# Ensure all three issuer countries remain available.
$issuerSelectPattern = '<select\b(?=[^>]*\bname="document_jurisdiction")[^>]*>.*?</select>'
$issuerSelectRegex = [System.Text.RegularExpressions.Regex]::new(
    $issuerSelectPattern,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$issuerMatch = $issuerSelectRegex.Match($page)

if (-not $issuerMatch.Success) {
    throw "Could not locate document_jurisdiction selector."
}

$issuerSelect = $issuerMatch.Value

foreach ($item in @(
    @{ Code = "PK"; Label = "Pakistan" },
    @{ Code = "SA"; Label = "Saudi Arabia" },
    @{ Code = "CN"; Label = "China" }
)) {
    if ($issuerSelect -notmatch ('value="' + $item.Code + '"')) {
        $issuerSelect = $issuerSelect.Replace(
            "</select>",
            ('  <option value="' + $item.Code + '">' + $item.Label + "</option>`r`n                                </select>")
        )
    }
}

$page = $page.Substring(0, $issuerMatch.Index) +
        $issuerSelect +
        $page.Substring($issuerMatch.Index + $issuerMatch.Length)

$page = $page.Replace(
    "This issuer is inherited by the participant&apos;s receipt application. Choose Pakistan, Saudi Arabia, or China before confirming payment.",
    "Admin can change the receipt issuing entity here. The saved issuer is inherited by any pending participant receipt application."
)

Write-Utf8 $pagePath $page

# ============================================================
# 2. Payment action: load current issuer if missing
# ============================================================

$actions = Read-Utf8 $actionsPath

$oldSelect =
    '"id, user_id, email, full_name, workshop_id, registration_status, payment_status, attendance_status, attendance_confirmed_at"'

$newSelect =
    '"id, user_id, email, full_name, workshop_id, registration_status, payment_status, attendance_status, attendance_confirmed_at, document_jurisdiction"'

if ($actions.Contains($oldSelect)) {
    $actions = $actions.Replace(
        $oldSelect,
        $newSelect
    )

    Write-Host "[OK] Registration action now loads document_jurisdiction." -ForegroundColor Green
}

# ============================================================
# 3. Payment-status whitelist if not already present
# ============================================================

if (-not $actions.Contains("const requestedPaymentStatus")) {
    $oldPaymentBlock = @'
  const paymentStatus =
    text(formData, "payment_status") ||
    registration.payment_status ||
    "pending";
'@

    $newPaymentBlock = @'
  const requestedPaymentStatus =
    text(formData, "payment_status") ||
    registration.payment_status ||
    "pending";

  const paymentStatus = [
    "pending",
    "instructions_sent",
    "under_review",
    "confirmed",
    "waived",
    "rejected",
  ].includes(requestedPaymentStatus)
    ? requestedPaymentStatus
    : registration.payment_status || "pending";
'@

    if ($actions.Contains($oldPaymentBlock)) {
        $actions = $actions.Replace(
            $oldPaymentBlock,
            $newPaymentBlock
        )

        Write-Host "[OK] Added payment status whitelist." -ForegroundColor Green
    }
    else {
        Write-Host "[!] Could not locate old paymentStatus block; leaving existing parser unchanged." -ForegroundColor Yellow
    }
}

# ============================================================
# 4. Replace the ENTIRE save_statuses case using boundaries
# ============================================================

$caseStartText = '    case "save_statuses":'
$nextCaseText = '    case "send_payment_message":'

$caseStart = $actions.IndexOf($caseStartText)
$nextCase = $actions.IndexOf($nextCaseText)

if ($caseStart -lt 0) {
    throw 'Could not locate case "save_statuses": in payment-actions.ts.'
}

if ($nextCase -lt 0 -or $nextCase -le $caseStart) {
    throw 'Could not locate the next case "send_payment_message": after save_statuses.'
}

$newSaveCase = @'
    case "save_statuses":
      if (
        paymentStatus === "confirmed" &&
        amountReceived <= 0
      ) {
        redirect(
          withMessage(
            returnTo,
            "error",
            "Confirmed Paid requires a positive Amount received."
          )
        );
      }

      updatePayload = {
        registration_status:
          registrationStatus,

        payment_status:
          paymentStatus,

        attendance_status:
          attendanceStatus,

        attendance_note:
          attendanceNote || null,

        attendance_confirmed_at:
          attendanceStatus === "attended"
            ? registration.attendance_confirmed_at ||
              new Date().toISOString()
            : null,

        attendance_confirmed_by:
          attendanceStatus === "attended"
            ? actor.user.id
            : null,

        amount_received:
          paymentStatus === "waived"
            ? 0
            : amountReceived,

        payment_currency:
          paymentCurrency,

        document_jurisdiction:
          documentJurisdiction,

        payment_link:
          paymentLink || null,

        payment_note:
          paymentNote || null,

        ...(paymentStatus === "confirmed" ||
        paymentStatus === "waived"
          ? {
              access_status: "granted",
            }
          : {}),
      };

      successMessage =
        "Registration, payment, attendance, amount, currency, and receipt issuer saved.";

      if (
        paymentStatus === "confirmed" &&
        registration.payment_status !==
          "confirmed"
      ) {
        notification = {
          title:
            "Payment confirmed",
          body:
            "Your payment has been confirmed and your workshop access is unlocked. You can now submit your receipt application from Dashboard > Receipts.",
          sourceType:
            "payment_confirmed",
        };
      } else if (
        attendanceStatus ===
          "attended" &&
        registration.attendance_status !==
          "attended"
      ) {
        notification = {
          title:
            "Workshop attendance confirmed",
          body:
            "The admin has confirmed your workshop attendance. You can now apply from Dashboard > Certificates.",
          sourceType:
            "attendance_confirmed",
        };
      }

      break;

'@

$actions =
    $actions.Substring(0, $caseStart) +
    $newSaveCase +
    $actions.Substring($nextCase)

Write-Host "[OK] Replaced save_statuses block by switch-case boundary." -ForegroundColor Green

# ============================================================
# 5. Sync pending/rejected receipt application country
# ============================================================

if (-not $actions.Contains("receipt application issuer sync")) {
    $postUpdateAnchor = @'
  if (updateError) {
    redirect(withMessage(returnTo, "error", updateError.message));
  }

  if (notification) {
'@

    $syncBlock = @'
  if (updateError) {
    redirect(withMessage(returnTo, "error", updateError.message));
  }

  // receipt application issuer sync:
  // Registration Management is authoritative until receipt approval.
  if (
    [
      "save_statuses",
      "record_payment_received",
      "confirm_payment",
      "waive_payment",
    ].includes(intent)
  ) {
    const {
      error:
        receiptApplicationSyncError,
    } = await admin
      .from("receipt_applications")
      .update({
        jurisdiction:
          documentJurisdiction,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "workshop_registration_id",
        registrationId
      )
      .in(
        "status",
        ["pending", "rejected"]
      );

    if (
      receiptApplicationSyncError
    ) {
      console.error(
        "Receipt application issuer sync failed:",
        receiptApplicationSyncError.message
      );
    }
  }

  if (notification) {
'@

    if ($actions.Contains($postUpdateAnchor)) {
        $actions = $actions.Replace(
            $postUpdateAnchor,
            $syncBlock
        )

        Write-Host "[OK] Pending receipt applications now follow admin country changes." -ForegroundColor Green
    }
    else {
        Write-Host "[!] Could not locate post-update sync anchor; country still saves on registration, but pending applications will not auto-sync." -ForegroundColor Yellow
    }
}

Write-Utf8 $actionsPath $actions

# ============================================================
# 6. Clear cache + typecheck
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
Write-Host "ADMIN PAYMENT + COUNTRY CONTROLS RESTORED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""
Write-Host "No SQL migration is required." -ForegroundColor Cyan
Write-Host ""
Write-Host "Then run:" -ForegroundColor Yellow
Write-Host "  npm.cmd run build"
Write-Host "  npm.cmd run dev"
Write-Host ""
Write-Host "Expected manager controls:" -ForegroundColor Cyan
Write-Host "  Payment status:"
Write-Host "    Unpaid / Pending"
Write-Host "    Instructions Sent"
Write-Host "    Under Review"
Write-Host "    Confirmed Paid"
Write-Host "    Waived"
Write-Host "    Rejected"
Write-Host ""
Write-Host "  Receipt issuing entity:"
Write-Host "    Pakistan"
Write-Host "    Saudi Arabia"
Write-Host "    China"
Write-Host ""
Write-Host "Save registration, payment & attendance now persists:"
Write-Host "  payment status"
Write-Host "  amount"
Write-Host "  currency"
Write-Host "  issuer country"
Write-Host "  attendance"
Write-Host "  registration status"

$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\receipt-payment-sync-recovery-$timestamp"

$paymentActionsPath = Join-Path $root "app\manager\actions\payment-actions.ts"
$registrationsPagePath = Join-Path $root "app\manager\registrations\page.tsx"
$receiptActionsPath = Join-Path $root "app\dashboard\receipts\actions.ts"
$receiptPagePath = Join-Path $root "app\dashboard\receipts\page.tsx"
$adminReceiptActionsPath = Join-Path $root "app\admin\documents\receipts\actions.ts"
$migrationPath = Join-Path $root "supabase\migrations\20260821_harden_workshop_payment_receipt_sync.sql"

foreach ($path in @(
    $paymentActionsPath,
    $registrationsPagePath,
    $receiptActionsPath,
    $receiptPagePath,
    $adminReceiptActionsPath
)) {
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

function Replace-RegexOptional {
    param(
        [string]$Content,
        [string]$Pattern,
        [string]$Replacement,
        [string]$Label
    )

    $regex = [System.Text.RegularExpressions.Regex]::new(
        $Pattern,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    if ($regex.IsMatch($Content)) {
        $updated = $regex.Replace(
            $Content,
            $Replacement,
            1
        )

        Write-Host "[OK] $Label" -ForegroundColor Green
        return $updated
    }

    Write-Host "[!] Anchor not found or already changed: $Label" -ForegroundColor Yellow
    return $Content
}

# ============================================================
# 1. Ensure server-side payment hardening exists
# ============================================================

Backup-File $paymentActionsPath
$paymentActions = Read-Utf8 $paymentActionsPath

if (-not $paymentActions.Contains('Use Confirm & unlock to confirm payment.')) {
    $pattern = 'case\s+"save_statuses"\s*:\s*updatePayload\s*=\s*\{'

    $replacement = @'
case "save_statuses":
      if (
        paymentStatus === "confirmed" &&
        registration.payment_status !== "confirmed"
      ) {
        redirect(
          withMessage(
            returnTo,
            "error",
            "Use Confirm & unlock to confirm payment. This guarantees the confirmed amount, currency, issuer, and receipt eligibility stay synchronized."
          )
        );
      }

      if (
        paymentStatus === "waived" &&
        registration.payment_status !== "waived"
      ) {
        redirect(
          withMessage(
            returnTo,
            "error",
            "Use Waive & unlock to waive payment. This keeps payment and access state synchronized."
          )
        );
      }

      updatePayload = {
'@

    $saveStatusRegex = [System.Text.RegularExpressions.Regex]::new(
        $pattern,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    if ($saveStatusRegex.IsMatch($paymentActions)) {
        $paymentActions = $saveStatusRegex.Replace(
            $paymentActions,
            $replacement,
            1
        )
        Write-Host "[OK] Generic save cannot newly confirm/waive payment." -ForegroundColor Green
    }
    else {
        throw "Could not locate save_statuses in payment-actions.ts."
    }
}
else {
    Write-Host "[OK] Server payment transition guard already present." -ForegroundColor DarkGreen
}

# Revalidate receipt pages explicitly.
if (-not $paymentActions.Contains('revalidatePath("/dashboard/receipts")')) {
    $paymentActions = $paymentActions.Replace(
        'revalidatePath("/dashboard/documents");',
        'revalidatePath("/dashboard/documents");' + "`r`n" +
        '  revalidatePath("/dashboard/receipts");'
    )
}

if (-not $paymentActions.Contains('revalidatePath("/admin/documents/receipts")')) {
    $paymentActions = $paymentActions.Replace(
        'revalidatePath("/admin/documents");',
        'revalidatePath("/admin/documents");' + "`r`n" +
        '  revalidatePath("/admin/documents/receipts");'
    )
}

# PK / SA only.
$paymentActions = [regex]::Replace(
    $paymentActions,
    '\["PK",\s*"SA",\s*"CN"\]\.includes\(requestedJurisdiction\)',
    '["PK", "SA"].includes(requestedJurisdiction)'
)

# Updated notifications, whether old wording still exists or not.
$paymentActions = $paymentActions.Replace(
    'The admin has confirmed your workshop attendance. You can now apply for your certificate under Certificates & Receipts.',
    'The admin has confirmed your workshop attendance. You can now apply from Dashboard > Certificates.'
)

$paymentActions = $paymentActions.Replace(
    'Enter the confirmed amount before releasing a receipt.',
    'Enter the confirmed amount before confirming payment.'
)

$oldPaymentBody =
    'Your payment has been confirmed, your workshop access is unlocked, and your official payment receipt is available under Certificates & Receipts.'

$newPaymentBody =
    'Your payment has been confirmed and your workshop access is unlocked. You can now submit your receipt application from Dashboard > Receipts.'

$paymentActions = $paymentActions.Replace(
    $oldPaymentBody,
    $newPaymentBody
)

$paymentActions = $paymentActions.Replace(
    'successMessage = "Payment confirmed and workshop access unlocked.";',
    'successMessage = "Payment confirmed, workshop access unlocked, and receipt application enabled.";'
)

Write-Utf8 $paymentActionsPath $paymentActions

# ============================================================
# 2. Robust registration-manager UI patch
# ============================================================

Backup-File $registrationsPagePath
$registrationsPage = Read-Utf8 $registrationsPagePath

# Turn Confirmed into an option visible only if the row is already confirmed.
if (
    -not $registrationsPage.Contains(
        'registration.payment_status === "confirmed"'
    )
) {
    $confirmedPattern =
        '<option\s+value=["'']confirmed["''][^>]*>.*?</option>'

    $confirmedReplacement = @'
{registration.payment_status === "confirmed" ? (
                                      <option value="confirmed">
                                        Confirmed Paid
                                      </option>
                                    ) : null}
'@

    $registrationsPage = Replace-RegexOptional `
        $registrationsPage `
        $confirmedPattern `
        $confirmedReplacement `
        "hide Confirmed Paid as a generic transition"
}
else {
    Write-Host "[OK] Confirmed option already conditional." -ForegroundColor DarkGreen
}

# Same for waived.
if (
    -not $registrationsPage.Contains(
        'registration.payment_status === "waived"'
    )
) {
    $waivedPattern =
        '<option\s+value=["'']waived["''][^>]*>.*?</option>'

    $waivedReplacement = @'
{registration.payment_status === "waived" ? (
                                      <option value="waived">
                                        Waived
                                      </option>
                                    ) : null}
'@

    $registrationsPage = Replace-RegexOptional `
        $registrationsPage `
        $waivedPattern `
        $waivedReplacement `
        "hide Waived as a generic transition"
}
else {
    Write-Host "[OK] Waived option already conditional." -ForegroundColor DarkGreen
}

# Remove China from this workshop receipt issuer select.
$registrationsPage = [regex]::Replace(
    $registrationsPage,
    '\s*<option\s+value=["'']CN["''][^>]*>\s*China\s*</option>',
    '',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

# Relabel the issuer selector using flexible matching.
$registrationsPage = [regex]::Replace(
    $registrationsPage,
    'Receipt\s*/\s*certificate\s+jurisdiction',
    'Receipt issuing entity',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$registrationsPage = $registrationsPage.Replace(
    "Select the issuing entity, not the participant&apos;s nationality.",
    "This issuer is inherited by the participant&apos;s receipt application. Change it here before confirming payment if needed."
)

Write-Utf8 $registrationsPagePath $registrationsPage

# ============================================================
# 3. Overwrite participant receipt action with authoritative
#    registration-issuer implementation
# ============================================================

Backup-File $receiptActionsPath

$receiptActions = @'
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function result(key: "message" | "error", value: string) {
  return `/dashboard/receipts?${key}=${encodeURIComponent(value)}`;
}

export async function applyForWorkshopReceiptAction(formData: FormData) {
  const registrationId = field(formData, "registration_id");
  const recipientType = field(formData, "recipient_type");
  const recipientName = field(formData, "recipient_name");
  const registrationNumber = field(
    formData,
    "recipient_registration_number"
  );
  const recipientEmail = field(formData, "recipient_email");

  if (
    !registrationId ||
    !["personal", "company"].includes(recipientType) ||
    recipientName.length < 2 ||
    registrationNumber.length < 2 ||
    !recipientEmail
  ) {
    redirect(
      result(
        "error",
        "Complete the required recipient information."
      )
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: registration, error: registrationError } = await admin
    .from("workshop_registrations")
    .select(
      "id,user_id,workshop_id,payment_status,amount_received,payment_currency,document_jurisdiction"
    )
    .eq("id", registrationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (registrationError || !registration) {
    redirect(
      result(
        "error",
        "Workshop registration not found."
      )
    );
  }

  const paymentStatus = String(
    registration.payment_status || ""
  ).toLowerCase();

  if (!["confirmed", "paid"].includes(paymentStatus)) {
    redirect(
      result(
        "error",
        "Payment must be confirmed before a receipt can be requested."
      )
    );
  }

  const amount = Number(
    registration.amount_received || 0
  );

  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(
      result(
        "error",
        "The confirmed payment amount is missing. Ask the manager to reconfirm the payment."
      )
    );
  }

  const jurisdiction = String(
    registration.document_jurisdiction || ""
  ).toUpperCase();

  if (!["PK", "SA"].includes(jurisdiction)) {
    redirect(
      result(
        "error",
        "The receipt issuing entity is not configured as Pakistan or Saudi Arabia. Ask the manager to correct the registration issuer."
      )
    );
  }

  const { data: issuer } = await admin
    .from("document_issuer_profiles")
    .select("jurisdiction")
    .eq("jurisdiction", jurisdiction)
    .maybeSingle();

  if (!issuer) {
    redirect(
      result(
        "error",
        "The selected receipt issuing entity has not been configured by the administrator."
      )
    );
  }

  const { data: existingDocument } = await admin
    .from("official_documents")
    .select("id,status")
    .eq("document_type", "receipt")
    .eq("source_type", "workshop_registration")
    .eq("source_id", registration.id)
    .maybeSingle();

  if (existingDocument) {
    redirect(
      result(
        "error",
        "A receipt has already been generated for this payment."
      )
    );
  }

  const { data: existing } = await admin
    .from("receipt_applications")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("workshop_registration_id", registration.id)
    .maybeSingle();

  if (existing?.status === "approved") {
    redirect(
      result(
        "error",
        "This receipt application has already been approved."
      )
    );
  }

  if (existing?.status === "pending") {
    redirect(
      result(
        "error",
        "A receipt application is already awaiting review."
      )
    );
  }

  const payload = {
    user_id: user.id,
    workshop_registration_id: registration.id,
    workshop_id: registration.workshop_id,
    jurisdiction,
    recipient_type: recipientType,
    recipient_name: recipientName,
    recipient_registration_number: registrationNumber,
    recipient_tax_number:
      field(formData, "recipient_tax_number") || null,
    recipient_vat_number:
      field(formData, "recipient_vat_number") || null,
    recipient_email: recipientEmail,
    recipient_phone:
      field(formData, "recipient_phone") || null,
    recipient_address:
      field(formData, "recipient_address") || null,
    participant_note:
      field(formData, "participant_note") || null,
    status: "pending",
    admin_note: null,
    reviewed_by: null,
    reviewed_at: null,
    updated_at: new Date().toISOString(),
  };

  const operation = existing
    ? admin
        .from("receipt_applications")
        .update(payload)
        .eq("id", existing.id)
    : admin
        .from("receipt_applications")
        .insert(payload);

  const { error } = await operation;

  if (error) {
    redirect(
      result("error", error.message)
    );
  }

  revalidatePath("/dashboard/receipts");
  revalidatePath("/admin/documents/receipts");

  redirect(
    result(
      "message",
      "Receipt application submitted for admin review."
    )
  );
}
'@

Write-Utf8 $receiptActionsPath $receiptActions
Write-Host "[OK] Receipt application issuer now comes only from registration." -ForegroundColor Green

# ============================================================
# 4. Patch receipt page with flexible regex
# ============================================================

Backup-File $receiptPagePath
$receiptPage = Read-Utf8 $receiptPagePath

if (-not $receiptPage.Contains("document_jurisdiction")) {
    $registrationSelectRegex = [System.Text.RegularExpressions.Regex]::new(
        '"id,workshop_id,payment_status,amount_received,payment_currency,email,workshops\(title\)"'
    )

    $receiptPage = $registrationSelectRegex.Replace(
        $receiptPage,
        '"id,workshop_id,payment_status,amount_received,payment_currency,document_jurisdiction,email,workshops(title)"',
        1
    )
}

if (-not $receiptPage.Contains("const registrationJurisdiction")) {
    $anchorPattern =
        'const\s+title\s*=\s*workshop\?\.title\s*\|\|\s*"Workshop payment";'

    $anchorReplacement = @'
const title = workshop?.title || "Workshop payment";

            const registrationJurisdiction = String(
              registration.document_jurisdiction || ""
            ).toUpperCase();

            const issuer = issuers.find(
              (item: any) =>
                String(item.jurisdiction).toUpperCase() ===
                registrationJurisdiction
            );

            const issuerSupported =
              ["PK", "SA"].includes(registrationJurisdiction) &&
              Boolean(issuer);
'@

    $anchorRegex = [System.Text.RegularExpressions.Regex]::new(
        $anchorPattern
    )

    if ($anchorRegex.IsMatch($receiptPage)) {
        $receiptPage = $anchorRegex.Replace(
            $receiptPage,
            $anchorReplacement,
            1
        )
        Write-Host "[OK] Receipt page derives issuer from registration." -ForegroundColor Green
    }
    else {
        throw "Could not locate Workshop payment title anchor in dashboard/receipts/page.tsx."
    }
}

# Replace any participant jurisdiction select.
$issuerSelectPattern =
    '(?s)<label[^>]*>\s*Issuing entity\s*<select[^>]*name=["'']jurisdiction["''][^>]*>.*?</select>\s*</label>'

$issuerDisplay = @'
<div className="grid gap-2 text-sm font-black">
                    Issuing entity
                    <div
                      className={`rounded-xl border px-4 py-3 ${
                        issuerSupported
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-red-200 bg-red-50 text-red-800"
                      }`}
                    >
                      {issuerSupported
                        ? `${
                            jurisdictionNames[
                              normalizeJurisdiction(
                                registrationJurisdiction
                              )
                            ]
                          } - ${
                            issuer?.trading_name ||
                            issuer?.legal_name
                          }`
                        : "Issuer unavailable. Ask the manager to set Pakistan or Saudi Arabia on this registration."}
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      The issuing entity is set by Registration & Payment Management
                      and cannot be changed in the receipt request.
                    </p>
                  </div>
'@

$issuerSelectRegex = [System.Text.RegularExpressions.Regex]::new(
    $issuerSelectPattern,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

if ($issuerSelectRegex.IsMatch($receiptPage)) {
    $receiptPage = $issuerSelectRegex.Replace(
        $receiptPage,
        $issuerDisplay,
        1
    )
    Write-Host "[OK] Participant issuer selector replaced by read-only issuer." -ForegroundColor Green
}
elseif ($receiptPage.Contains("The issuing entity is set by Registration & Payment Management")) {
    Write-Host "[OK] Participant issuer is already read-only." -ForegroundColor DarkGreen
}
else {
    throw "Could not locate participant issuing-entity selector."
}

if (-not $receiptPage.Contains('disabled={!issuerSupported}')) {
    $submitPattern =
        '<button\s+className="mt-5 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white">\s*Submit receipt application\s*</button>'

    $submitReplacement = @'
<button
                  disabled={!issuerSupported}
                  className="mt-5 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Submit receipt application
                </button>
'@

    $submitRegex = [System.Text.RegularExpressions.Regex]::new(
        $submitPattern,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    if ($submitRegex.IsMatch($receiptPage)) {
        $receiptPage = $submitRegex.Replace(
            $receiptPage,
            $submitReplacement,
            1
        )
    }
}

Write-Utf8 $receiptPagePath $receiptPage

# ============================================================
# 5. Admin receipt approval issuer re-check
# ============================================================

Backup-File $adminReceiptActionsPath
$adminReceiptActions = Read-Utf8 $adminReceiptActionsPath

if (-not $adminReceiptActions.Contains("document_jurisdiction")) {
    $adminReceiptActions = $adminReceiptActions.Replace(
        '"id,user_id,workshop_id,payment_status,amount_received,payment_currency"',
        '"id,user_id,workshop_id,payment_status,amount_received,payment_currency,document_jurisdiction"'
    )
}

if (-not $adminReceiptActions.Contains("Receipt issuer mismatch detected.")) {
    $jurisdictionPattern =
        'const\s+jurisdiction\s*=\s*normalizeJurisdiction\(\s*application\.jurisdiction\s*\);'

    $jurisdictionReplacement = @'
const registrationJurisdiction = String(
    registration.document_jurisdiction || ""
  ).toUpperCase();

  if (!["PK", "SA"].includes(registrationJurisdiction)) {
    redirect(
      back(
        "error",
        "The source registration does not have a valid Pakistan or Saudi Arabia receipt issuer."
      )
    );
  }

  if (
    registrationJurisdiction !==
    String(application.jurisdiction || "").toUpperCase()
  ) {
    redirect(
      back(
        "error",
        "Receipt issuer mismatch detected. Ask the participant to reapply after the registration issuer is corrected."
      )
    );
  }

  const jurisdiction = normalizeJurisdiction(
    registrationJurisdiction
  );
'@

    $jurisdictionRegex = [System.Text.RegularExpressions.Regex]::new(
        $jurisdictionPattern,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    if ($jurisdictionRegex.IsMatch($adminReceiptActions)) {
        $adminReceiptActions = $jurisdictionRegex.Replace(
            $adminReceiptActions,
            $jurisdictionReplacement,
            1
        )
        Write-Host "[OK] Admin issuance now re-checks registration issuer." -ForegroundColor Green
    }
    else {
        throw "Could not locate receipt jurisdiction assignment in admin receipt actions."
    }
}
else {
    Write-Host "[OK] Admin issuer mismatch guard already present." -ForegroundColor DarkGreen
}

Write-Utf8 $adminReceiptActionsPath $adminReceiptActions

# ============================================================
# 6. Database guard migration
# ============================================================

Backup-File $migrationPath

$migration = @'
begin;

update public.workshop_registrations
set
  payment_status = 'under_review',
  updated_at = now()
where payment_status = 'confirmed'
  and coalesce(amount_received, 0) <= 0;

create or replace function public.enforce_workshop_confirmed_payment_amount()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.payment_status = 'confirmed'
     and coalesce(new.amount_received, 0) <= 0 then
    raise exception
      'Confirmed workshop payment requires amount_received > 0';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_workshop_confirmed_payment_amount
on public.workshop_registrations;

create trigger enforce_workshop_confirmed_payment_amount
before insert or update of payment_status, amount_received
on public.workshop_registrations
for each row
execute function public.enforce_workshop_confirmed_payment_amount();

notify pgrst, 'reload schema';

commit;
'@

New-Item -ItemType Directory `
    -Path (Split-Path -Parent $migrationPath) `
    -Force |
    Out-Null

Write-Utf8 $migrationPath $migration

# ============================================================
# 7. TypeScript excludes
# ============================================================

$tsconfigPath = Join-Path $root "tsconfig.json"

if (Test-Path -LiteralPath $tsconfigPath) {
    $tempScript = Join-Path $env:TEMP "receipt-sync-recovery-$timestamp.cjs"

    $nodeScript = @'
const fs = require("fs");
const path = require("path");
const ts = require(require.resolve("typescript", { paths: [process.cwd()] }));

const file = path.join(process.cwd(), "tsconfig.json");
const source = fs.readFileSync(file, "utf8");
const parsed = ts.parseConfigFileTextToJson(file, source);

if (parsed.error) {
  throw new Error(
    ts.flattenDiagnosticMessageText(parsed.error.messageText, "\n")
  );
}

const config = parsed.config || {};
const current = Array.isArray(config.exclude)
  ? config.exclude
  : [];

config.exclude = Array.from(
  new Set([
    ...current,
    "node_modules",
    ".next",
    "_backups",
    "separate-participant-documents-patch",
    "separate-participant-documents-patch/**",
    "**/*.backup-*"
  ])
);

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

Write-Host ""
Write-Host "Running TypeScript check..." -ForegroundColor Yellow

npm.cmd run typecheck

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[!] TypeScript still has an error. Paste the exact error output." -ForegroundColor Red
    Write-Host "Backup: $backupRoot" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "RECEIPT / PAYMENT SYNC RECOVERY COMPLETE" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""
Write-Host "REQUIRED DATABASE STEP:" -ForegroundColor Yellow
Write-Host "Run this file in Supabase SQL Editor:"
Write-Host "  supabase\migrations\20260821_harden_workshop_payment_receipt_sync.sql"
Write-Host ""
Write-Host "Then run:" -ForegroundColor Cyan
Write-Host "  npm.cmd run build"
Write-Host "  npm.cmd run dev"
Write-Host ""
Write-Host "Expected rules:" -ForegroundColor Cyan
Write-Host "  Confirmed payment requires amount > 0."
Write-Host "  Generic Save cannot newly confirm or waive payment."
Write-Host "  Receipt issuer comes from workshop registration only."
Write-Host "  Participant cannot change Pakistan/Saudi issuer."
Write-Host "  Admin issuance re-checks amount, payment status, and issuer."

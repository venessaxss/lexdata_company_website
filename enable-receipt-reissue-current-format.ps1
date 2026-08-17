$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\enable-receipt-format-reissue-$timestamp"

$pagePath = Join-Path $root "app\admin\documents\receipts\page.tsx"
$actionPath = Join-Path $root "app\admin\documents\receipts\reissue-actions.ts"

if (-not (Test-Path -LiteralPath $pagePath)) {
    throw "Cannot find: $pagePath`nRun this script from the LexData project root."
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

    New-Item -ItemType Directory `
        -Path (Split-Path -Parent $Path) `
        -Force | Out-Null

    [System.IO.File]::WriteAllText(
        $Path,
        $Content,
        $utf8
    )
}

Backup-File $pagePath
Backup-File $actionPath

# ============================================================
# 1. New self-contained reissue action
# ============================================================

$action = @'
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { normalizeJurisdiction } from "@/lib/official-documents";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function back(
  key: "message" | "error",
  value: string
) {
  return `/admin/documents/receipts?${key}=${encodeURIComponent(value)}`;
}

function formatSnapshot(format: any) {
  if (!format) return null;

  return {
    document_type:
      format.document_type,
    jurisdiction:
      format.jurisdiction,
    format_name:
      format.format_name,
    heading:
      format.heading,
    subheading:
      format.subheading,
    primary_color:
      format.primary_color,
    accent_color:
      format.accent_color,
    font_family:
      format.font_family,
    layout_style:
      format.layout_style,
    footer_text:
      format.footer_text,
    show_issuer_address:
      format.show_issuer_address,
    show_tax_id:
      format.show_tax_id,
  };
}

export async function reissueReceiptWithCurrentFormatAction(
  formData: FormData
) {
  const auth = await requireAdmin(
    "/admin/documents/receipts"
  );

  const id = field(formData, "id");
  const correctionReason = field(
    formData,
    "correction_reason"
  );

  if (!id) {
    redirect(
      back(
        "error",
        "Missing receipt ID."
      )
    );
  }

  if (correctionReason.length < 5) {
    redirect(
      back(
        "error",
        "Enter a clear correction reason before reissuing the receipt."
      )
    );
  }

  const { data: document, error: documentError } =
    await auth.admin
      .from("official_documents")
      .select("*")
      .eq("id", id)
      .eq("document_type", "receipt")
      .maybeSingle();

  if (documentError || !document) {
    redirect(
      back(
        "error",
        documentError?.message ||
          "Receipt not found."
      )
    );
  }

  if (document.status !== "void") {
    redirect(
      back(
        "error",
        "Only a revoked/void receipt can be reissued."
      )
    );
  }

  if (
    /refund|refunded|cancelled|canceled/i.test(
      String(
        document.revocation_reason || ""
      )
    )
  ) {
    redirect(
      back(
        "error",
        "A receipt voided because of a refund or cancellation cannot be reissued."
      )
    );
  }

  const jurisdiction =
    normalizeJurisdiction(
      document.jurisdiction
    );

  const [
    formatResult,
    issuerResult,
  ] = await Promise.all([
    auth.admin
      .from(
        "document_format_profiles"
      )
      .select("*")
      .eq(
        "document_type",
        "receipt"
      )
      .eq(
        "jurisdiction",
        jurisdiction
      )
      .maybeSingle(),

    auth.admin
      .from(
        "document_issuer_profiles"
      )
      .select("*")
      .eq(
        "jurisdiction",
        jurisdiction
      )
      .maybeSingle(),
  ]);

  const currentFormat =
    formatResult.data;

  const currentIssuer =
    issuerResult.data;

  if (
    formatResult.error ||
    !currentFormat
  ) {
    redirect(
      back(
        "error",
        formatResult.error?.message ||
          `No current ${jurisdiction} receipt format is configured.`
      )
    );
  }

  if (
    issuerResult.error ||
    !currentIssuer
  ) {
    redirect(
      back(
        "error",
        issuerResult.error?.message ||
          `No current ${jurisdiction} issuer profile is configured.`
      )
    );
  }

  const now =
    new Date().toISOString();

  const previousMetadata =
    document.metadata &&
    typeof document.metadata === "object"
      ? document.metadata
      : {};

  const previousHistory =
    Array.isArray(
      previousMetadata.reissue_history
    )
      ? previousMetadata.reissue_history
      : [];

  const previousFormat =
    previousMetadata.receipt_format ||
    null;

  const nextFormat =
    formatSnapshot(
      currentFormat
    );

  const nextMetadata = {
    ...previousMetadata,

    receipt_format:
      nextFormat,

    reissue_revision:
      Number(
        previousMetadata.reissue_revision ||
          0
      ) + 1,

    reissued_with_current_format:
      true,

    reissue_history: [
      ...previousHistory,
      {
        reissued_at:
          now,
        reissued_by:
          auth.user.id,
        correction_reason:
          correctionReason,
        prior_status:
          document.status,
        prior_revocation_reason:
          document.revocation_reason ||
          null,
        prior_receipt_format:
          previousFormat,
        new_receipt_format:
          nextFormat,
        issuer_jurisdiction:
          jurisdiction,
        issuer_stamp_url:
          currentIssuer.receipt_stamp_enabled
            ? currentIssuer.receipt_stamp_url ||
              null
            : null,
      },
    ],
  };

  const {
    error: updateError,
  } = await auth.admin
    .from("official_documents")
    .update({
      status:
        "issued",
      issued_at:
        now,
      issued_by:
        auth.user.id,
      revocation_reason:
        null,
      issuer_snapshot:
        currentIssuer,
      metadata:
        nextMetadata,
      updated_at:
        now,
    })
    .eq("id", document.id)
    .eq("status", "void");

  if (updateError) {
    redirect(
      back(
        "error",
        updateError.message
      )
    );
  }

  revalidatePath(
    "/admin/documents/receipts"
  );

  revalidatePath(
    `/documents/${document.id}`
  );

  revalidatePath(
    "/dashboard/receipts"
  );

  revalidatePath(
    "/dashboard/documents"
  );

  redirect(
    back(
      "message",
      `Receipt ${document.document_number} was reissued using the current ${jurisdiction} format and issuer snapshot.`
    )
  );
}
'@

Write-Utf8 $actionPath $action
Write-Host "[OK] Created current-format receipt reissue action." -ForegroundColor Green

# ============================================================
# 2. Patch admin receipt page to use the new action
# ============================================================

$page = Read-Utf8 $pagePath

# Add import.
if (-not $page.Contains('from "./reissue-actions"')) {
    $importInsert = @'
import {
  reissueReceiptWithCurrentFormatAction,
} from "./reissue-actions";
'@

    $lastImportPattern = '(?m)^(import[\s\S]*?;\r?\n)'
    # Safer: insert before export const dynamic when available.
    $marker = 'export const dynamic'

    $markerIndex = $page.IndexOf($marker)

    if ($markerIndex -lt 0) {
        throw "Could not locate export const dynamic in admin receipt page."
    }

    $page = $page.Insert(
        $markerIndex,
        $importInsert + "`r`n"
    )

    Write-Host "[OK] Imported new reissue action." -ForegroundColor Green
}

# Replace form action usage.
if ($page.Contains('action={reissueRevokedDocumentWithCurrentFormatAction}')) {
    $page = $page.Replace(
        'action={reissueRevokedDocumentWithCurrentFormatAction}',
        'action={reissueReceiptWithCurrentFormatAction}'
    )

    Write-Host "[OK] Reissue button now uses the current-format reissue action." -ForegroundColor Green
}
elseif ($page.Contains('action={reissueReceiptWithCurrentFormatAction}')) {
    Write-Host "[OK] Reissue button already uses new action." -ForegroundColor DarkGreen
}
else {
    throw "Could not locate the Format correction Reissue form action."
}

# Remove old named import from ../actions to avoid unused import errors.
$page = [regex]::Replace(
    $page,
    '(?m)^\s*reissueRevokedDocumentWithCurrentFormatAction,\s*\r?\n',
    ''
)

# Improve the Format correction explanation.
if (
    -not $page.Contains(
        "Reissue keeps the original payment"
    )
) {
    $formatHeadingPattern =
        '(<p className="text-sm font-black text-amber-950">\s*Format correction\s*</p>)'

    $formatHeadingRegex =
        [System.Text.RegularExpressions.Regex]::new(
            $formatHeadingPattern,
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )

    if ($formatHeadingRegex.IsMatch($page)) {
        $explanation = @'
$1

                        <p className="mt-2 text-xs leading-5 text-amber-900">
                          Reissue keeps the original payment, recipient, receipt number,
                          verification identity, and tax references, but replaces the
                          saved receipt-format snapshot and issuer snapshot with the
                          current format and current active issuer stamp.
                        </p>
'@

        $page =
            $formatHeadingRegex.Replace(
                $page,
                $explanation,
                1
            )

        Write-Host "[OK] Added reissue behavior explanation to UI." -ForegroundColor Green
    }
}

Write-Utf8 $pagePath $page

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
Write-Host "CURRENT-FORMAT RECEIPT REISSUE ENABLED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""
Write-Host "No database migration is required." -ForegroundColor Cyan
Write-Host ""
Write-Host "Then run:" -ForegroundColor Yellow
Write-Host "  npm.cmd run build"
Write-Host "  npm.cmd run dev"
Write-Host ""
Write-Host "Admin workflow:" -ForegroundColor Cyan
Write-Host "  1. Revoke/void the incorrect receipt."
Write-Host "  2. Save the new receipt format / issuer stamp."
Write-Host "  3. Click Preview current format."
Write-Host "  4. Enter a correction reason."
Write-Host "  5. Click Reissue."
Write-Host ""
Write-Host "Reissue changes:" -ForegroundColor Cyan
Write-Host "  receipt format snapshot -> current"
Write-Host "  issuer snapshot -> current"
Write-Host "  issuer stamp -> current active stamp"
Write-Host "  status -> issued"
Write-Host ""
Write-Host "Reissue preserves:" -ForegroundColor Cyan
Write-Host "  document number"
Write-Host "  payment amount/currency"
Write-Host "  recipient data"
Write-Host "  verification identity"
Write-Host "  tax / authority references"
Write-Host ""
Write-Host "Audit:" -ForegroundColor Cyan
Write-Host "  old/new format snapshots and correction reason are stored in metadata.reissue_history"

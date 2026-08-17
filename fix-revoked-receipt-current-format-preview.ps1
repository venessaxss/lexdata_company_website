$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\fix-current-receipt-preview-$timestamp"

$documentPagePath = Join-Path $root "app\documents\[id]\page.tsx"
$adminReceiptPagePath = Join-Path $root "app\admin\documents\receipts\page.tsx"

foreach ($path in @(
    $documentPagePath,
    $adminReceiptPagePath
)) {
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

Backup-File $documentPagePath
Backup-File $adminReceiptPagePath

# ============================================================
# 1. Fix /documents/[id]?format=current
#    Use CURRENT receipt format + CURRENT issuer + CURRENT stamp
# ============================================================

$documentPage = Read-Utf8 $documentPagePath

if (-not $documentPage.Contains("let renderedIssuerData")) {
    $anchor = @'
  let renderedMetadata = { ...(document.metadata || {}) };
  let currentFormatPreview = false;
'@

    $replacement = @'
  let renderedMetadata = { ...(document.metadata || {}) };
  let renderedIssuerData = issuer(document);
  let currentFormatPreview = false;
'@

    if (-not $documentPage.Contains($anchor)) {
        throw "Could not locate renderedMetadata/currentFormatPreview block."
    }

    $documentPage = $documentPage.Replace(
        $anchor,
        $replacement
    )

    Write-Host "[OK] Added mutable rendered issuer snapshot." -ForegroundColor Green
}
else {
    Write-Host "[OK] Rendered issuer override already exists." -ForegroundColor DarkGreen
}

$oldReceiptPreviewBlock = @'
    if (document.document_type === "receipt") {
      const { data: currentFormat } = await admin
        .from("document_format_profiles")
        .select("*")
        .eq("document_type", "receipt")
        .eq("jurisdiction", document.jurisdiction)
        .maybeSingle();
      if (currentFormat) {
        renderedMetadata = { ...renderedMetadata, receipt_format: currentFormat };
        currentFormatPreview = true;
      }
'@

$newReceiptPreviewBlock = @'
    if (document.document_type === "receipt") {
      const previewJurisdiction = normalizeJurisdiction(
        document.jurisdiction
      );

      const [
        currentFormatResult,
        currentIssuerResult,
      ] = await Promise.all([
        admin
          .from("document_format_profiles")
          .select("*")
          .eq("document_type", "receipt")
          .eq("jurisdiction", previewJurisdiction)
          .maybeSingle(),

        admin
          .from("document_issuer_profiles")
          .select("*")
          .eq("jurisdiction", previewJurisdiction)
          .maybeSingle(),
      ]);

      const currentFormat =
        currentFormatResult.data;

      const currentIssuer =
        currentIssuerResult.data;

      if (currentFormat) {
        renderedMetadata = {
          ...renderedMetadata,
          receipt_format: currentFormat,
        };

        currentFormatPreview = true;
      }

      if (currentIssuer) {
        renderedIssuerData =
          currentIssuer;
      }
'@

if ($documentPage.Contains($oldReceiptPreviewBlock)) {
    $documentPage = $documentPage.Replace(
        $oldReceiptPreviewBlock,
        $newReceiptPreviewBlock
    )

    Write-Host "[OK] Current preview now loads current format + issuer + stamp." -ForegroundColor Green
}
elseif ($documentPage.Contains("currentIssuerResult")) {
    Write-Host "[OK] Current preview issuer query already exists." -ForegroundColor DarkGreen
}
else {
    # Flexible fallback for locally reformatted code.
    $pattern = @'
if\s*\(\s*document\.document_type\s*===\s*"receipt"\s*\)\s*\{\s*
const\s*\{\s*data:\s*currentFormat\s*\}\s*=\s*await\s*admin
[\s\S]*?
if\s*\(\s*currentFormat\s*\)\s*\{
[\s\S]*?
currentFormatPreview\s*=\s*true;\s*
\}
'@

    $regex = [System.Text.RegularExpressions.Regex]::new(
        $pattern,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    if (-not $regex.IsMatch($documentPage)) {
        throw "Could not locate receipt current-format preview block."
    }

    $documentPage = $regex.Replace(
        $documentPage,
        $newReceiptPreviewBlock.Trim(),
        1
    )

    Write-Host "[OK] Current preview block replaced using flexible match." -ForegroundColor Green
}

# Replace old immutable issuerData declaration.
$oldIssuer = '  const issuerData = issuer(document);'
$newIssuer = '  const issuerData = renderedIssuerData;'

if ($documentPage.Contains($oldIssuer)) {
    $documentPage = $documentPage.Replace(
        $oldIssuer,
        $newIssuer
    )

    Write-Host "[OK] Renderer now uses current issuer during correction preview." -ForegroundColor Green
}
elseif ($documentPage.Contains($newIssuer)) {
    Write-Host "[OK] Renderer already uses renderedIssuerData." -ForegroundColor DarkGreen
}
else {
    throw "Could not locate issuerData declaration."
}

# Make preview banner explicit.
$documentPage = $documentPage.Replace(
    "Previewing the current admin format on this revoked document. The saved document is unchanged until the admin reissues it.",
    "Previewing the current receipt format, current issuer profile, and current active issuer stamp on this revoked document. The saved document remains unchanged until Reissue is completed."
)

Write-Utf8 $documentPagePath $documentPage

# ============================================================
# 2. Admin receipt register:
#    revoked receipt main preview should open CURRENT correction
# ============================================================

$adminPage = Read-Utf8 $adminReceiptPagePath

$oldPrimaryPreview = @'
                <Link
                  href={`/documents/${document.id}`}
                  className="mt-4 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-black"
                >
                  Preview receipt
                </Link>
'@

$newPrimaryPreview = @'
                <Link
                  href={
                    document.status === "void" &&
                    !/refund|refunded|cancelled|canceled/i.test(
                      String(document.revocation_reason || "")
                    )
                      ? `/documents/${document.id}?format=current`
                      : `/documents/${document.id}`
                  }
                  className="mt-4 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-black"
                >
                  {document.status === "void" &&
                  !/refund|refunded|cancelled|canceled/i.test(
                    String(document.revocation_reason || "")
                  )
                    ? "Preview corrected receipt"
                    : "Preview receipt"}
                </Link>
'@

if ($adminPage.Contains($oldPrimaryPreview)) {
    $adminPage = $adminPage.Replace(
        $oldPrimaryPreview,
        $newPrimaryPreview
    )

    Write-Host "[OK] Revoked receipt primary preview now opens current correction format." -ForegroundColor Green
}
elseif ($adminPage.Contains("Preview corrected receipt")) {
    Write-Host "[OK] Corrected receipt primary preview already exists." -ForegroundColor DarkGreen
}
else {
    throw "Could not locate primary Preview receipt link."
}

# Clarify the yellow panel buttons: current correction + original snapshot.
$oldCorrectionPreview = @'
                      <Link
                        href={`/documents/${document.id}?format=current`}
                        className="mt-3 inline-flex rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-black text-amber-950"
                      >
                        Preview current format
                      </Link>
'@

$newCorrectionPreview = @'
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/documents/${document.id}?format=current`}
                          className="inline-flex rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-black text-amber-950"
                        >
                          Preview corrected receipt
                        </Link>

                        <Link
                          href={`/documents/${document.id}`}
                          className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700"
                        >
                          View revoked original
                        </Link>
                      </div>
'@

if ($adminPage.Contains($oldCorrectionPreview)) {
    $adminPage = $adminPage.Replace(
        $oldCorrectionPreview,
        $newCorrectionPreview
    )

    Write-Host "[OK] Added explicit corrected/original preview choices." -ForegroundColor Green
}

Write-Utf8 $adminReceiptPagePath $adminPage

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
Write-Host "CURRENT RECEIPT CORRECTION PREVIEW FIXED" -ForegroundColor Green
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
Write-Host "Expected revoked receipt workflow:" -ForegroundColor Cyan
Write-Host "  Save new jurisdiction receipt format"
Write-Host "  Upload/activate current issuer stamp"
Write-Host "  Click Preview corrected receipt"
Write-Host "  Preview now uses current format + current issuer + current stamp"
Write-Host "  Enter correction reason"
Write-Host "  Reissue"

$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\certificate-jurisdiction-sync-$timestamp"

$documentPagePath = Join-Path $root "app\documents\[id]\page.tsx"
$adminActionsPath = Join-Path $root "app\admin\documents\actions.ts"
$adminCertificatePagePath = Join-Path $root "app\admin\documents\certificates\page.tsx"

foreach ($path in @(
    $documentPagePath,
    $adminActionsPath,
    $adminCertificatePagePath
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

foreach ($path in @(
    $documentPagePath,
    $adminActionsPath,
    $adminCertificatePagePath
)) {
    Backup-File $path
}

# ============================================================
# 1. CURRENT CERTIFICATE PREVIEW
#    Follow workshop_registrations.document_jurisdiction.
# ============================================================

$documentPage = Read-Utf8 $documentPagePath

if (-not $documentPage.Contains("let renderedJurisdiction")) {
    $anchor = @'
  let renderedMetadata = { ...(document.metadata || {}) };
  let renderedIssuerData = issuer(document);
  let currentFormatPreview = false;
'@

    $replacement = @'
  let renderedMetadata = { ...(document.metadata || {}) };
  let renderedIssuerData = issuer(document);
  let renderedJurisdiction = normalizeJurisdiction(
    document.jurisdiction
  );
  let currentFormatPreview = false;
'@

    if (-not $documentPage.Contains($anchor)) {
        throw "Could not locate rendered document state in app/documents/[id]/page.tsx."
    }

    $documentPage = $documentPage.Replace(
        $anchor,
        $replacement
    )

    Write-Host "[OK] Added rendered certificate jurisdiction state." -ForegroundColor Green
}

# Patch only certificate preview branch, not unrelated queries.
$certificateBranchStart = $documentPage.IndexOf(
    'else if (document.source_type === "workshop_registration")'
)

if ($certificateBranchStart -lt 0) {
    throw "Could not locate workshop certificate current-preview branch."
}

$jurisdictionConstIndex = $documentPage.IndexOf(
    "  const jurisdiction =",
    $certificateBranchStart
)

if ($jurisdictionConstIndex -lt 0) {
    throw "Could not locate jurisdiction rendering line after certificate preview branch."
}

$certificateBranch = $documentPage.Substring(
    $certificateBranchStart,
    $jurisdictionConstIndex - $certificateBranchStart
)

$certificateBranch = $certificateBranch.Replace(
    '.select("workshop_id")',
    '.select("workshop_id,document_jurisdiction")'
)

if (-not $certificateBranch.Contains("renderedJurisdiction = normalizeJurisdiction")) {
    $registrationAnchor = @'
      if (registration) {
        const { data: template } = await admin
'@

    $registrationReplacement = @'
      if (registration) {
        renderedJurisdiction = normalizeJurisdiction(
          registration.document_jurisdiction
        );

        const { data: currentCertificateIssuer } = await admin
          .from("document_issuer_profiles")
          .select("*")
          .eq("jurisdiction", renderedJurisdiction)
          .maybeSingle();

        if (currentCertificateIssuer) {
          renderedIssuerData = currentCertificateIssuer;
        }

        const { data: template } = await admin
'@

    if (-not $certificateBranch.Contains($registrationAnchor)) {
        throw "Could not locate certificate preview registration block."
    }

    $certificateBranch = $certificateBranch.Replace(
        $registrationAnchor,
        $registrationReplacement
    )
}

$documentPage =
    $documentPage.Substring(0, $certificateBranchStart) +
    $certificateBranch +
    $documentPage.Substring($jurisdictionConstIndex)

$documentPage = [regex]::Replace(
    $documentPage,
    'const jurisdiction = normalizeJurisdiction\(document\.jurisdiction\);',
    'const jurisdiction = renderedJurisdiction;',
    1
)

# Make the admin preview banner correct for both receipt/certificate.
$oldBanner = @'
          Previewing the current receipt format, current issuer profile, and current active issuer stamp on this revoked document. The saved document remains unchanged until Reissue is completed.
'@

$newBanner = @'
          {document.document_type === "certificate"
            ? "Previewing the current certificate format and the issuing jurisdiction currently selected in Registration Management. The revoked document remains unchanged until Reissue is completed."
            : "Previewing the current receipt format, current issuer profile, and current active issuer stamp on this voided document. The saved document remains unchanged until Reissue is completed."}
'@

if ($documentPage.Contains($oldBanner)) {
    $documentPage = $documentPage.Replace(
        $oldBanner,
        $newBanner
    )
}

Write-Utf8 $documentPagePath $documentPage
Write-Host "[OK] Corrected certificate preview now follows the currently selected country." -ForegroundColor Green

# ============================================================
# 2. CERTIFICATE REISSUE
#    Synchronize jurisdiction + issuer snapshot.
#    If jurisdiction changes, generate a new matching certificate
#    number because LD-C-PK / CN / SA embeds jurisdiction.
# ============================================================

$adminActions = Read-Utf8 $adminActionsPath

$reissueStart = $adminActions.IndexOf(
    "export async function reissueRevokedDocumentWithCurrentFormatAction"
)

if ($reissueStart -lt 0) {
    throw "Could not locate reissueRevokedDocumentWithCurrentFormatAction."
}

$nextExport = $adminActions.IndexOf(
    "export async function ",
    $reissueStart + 20
)

if ($nextExport -lt 0) {
    $nextExport = $adminActions.Length
}

$reissueBlock = $adminActions.Substring(
    $reissueStart,
    $nextExport - $reissueStart
)

if (-not $reissueBlock.Contains("let reissueJurisdiction")) {
    $stateAnchor = @'
  let metadata = { ...(document.metadata || {}) };
  let formatReference: Record<string, unknown> = {};
'@

    $stateReplacement = @'
  let metadata = { ...(document.metadata || {}) };
  let formatReference: Record<string, unknown> = {};

  let reissueJurisdiction = normalizeJurisdiction(
    document.jurisdiction
  );

  let reissueDocumentNumber =
    document.document_number;

  let reissueIssuerSnapshot =
    document.issuer_snapshot || {};
'@

    if (-not $reissueBlock.Contains($stateAnchor)) {
        throw "Could not locate reissue metadata state."
    }

    $reissueBlock = $reissueBlock.Replace(
        $stateAnchor,
        $stateReplacement
    )
}

# Only modify the certificate branch registration selection.
$certificateElse = $reissueBlock.IndexOf(
    '} else {'
)

if ($certificateElse -lt 0) {
    throw "Could not locate certificate branch in reissue action."
}

$certificateReissueBranch = $reissueBlock.Substring(
    $certificateElse
)

$certificateReissueBranch = $certificateReissueBranch.Replace(
    '.select("workshop_id")',
    '.select("workshop_id,document_jurisdiction")'
)

if (-not $certificateReissueBranch.Contains("reissueJurisdiction = normalizeJurisdiction")) {
    $registrationFoundAnchor = @'
    if (!registration) {
      redirect(certificateBack("error", "The original workshop registration could not be found."));
    }
    const { data: template } = await auth.admin
'@

    $registrationFoundReplacement = @'
    if (!registration) {
      redirect(certificateBack("error", "The original workshop registration could not be found."));
    }

    reissueJurisdiction = normalizeJurisdiction(
      registration.document_jurisdiction
    );

    const { data: currentCertificateIssuer } =
      await auth.admin
        .from("document_issuer_profiles")
        .select("*")
        .eq(
          "jurisdiction",
          reissueJurisdiction
        )
        .maybeSingle();

    if (currentCertificateIssuer) {
      reissueIssuerSnapshot =
        currentCertificateIssuer;
    }

    if (
      reissueJurisdiction !==
      normalizeJurisdiction(
        document.jurisdiction
      )
    ) {
      const {
        data: generatedDocumentNumber,
        error: documentNumberError,
      } = await auth.admin.rpc(
        "document_number",
        {
          p_type: "certificate",
          p_jurisdiction:
            reissueJurisdiction,
        }
      );

      if (
        documentNumberError ||
        !generatedDocumentNumber
      ) {
        redirect(
          certificateBack(
            "error",
            documentNumberError?.message ||
              "Could not generate a certificate number for the new jurisdiction."
          )
        );
      }

      reissueDocumentNumber =
        String(
          generatedDocumentNumber
        );
    }

    const { data: template } = await auth.admin
'@

    if (-not $certificateReissueBranch.Contains($registrationFoundAnchor)) {
        throw "Could not locate registration validation inside certificate reissue branch."
    }

    $certificateReissueBranch = $certificateReissueBranch.Replace(
        $registrationFoundAnchor,
        $registrationFoundReplacement
    )

    $reissueBlock =
        $reissueBlock.Substring(0, $certificateElse) +
        $certificateReissueBranch
}

# Update current revoked document in-place.
if (-not $reissueBlock.Contains("document_number: reissueDocumentNumber")) {
    $updateAnchor = @'
    .update({
      status: "issued",
'@

    $updateReplacement = @'
    .update({
      document_number:
        reissueDocumentNumber,
      jurisdiction:
        reissueJurisdiction,
      issuer_snapshot:
        reissueIssuerSnapshot,
      status: "issued",
'@

    if (-not $reissueBlock.Contains($updateAnchor)) {
        throw "Could not locate official_documents reissue update."
    }

    $reissueBlock = $reissueBlock.Replace(
        $updateAnchor,
        $updateReplacement
    )
}

# Add jurisdiction/number transition into audit details.
if (-not $reissueBlock.Contains("previous_jurisdiction: document.jurisdiction")) {
    $auditDetailsAnchor = @'
      correction_reason: correctionReason,
      previous_revocation_reason: previousRevocationReason,
      ...formatReference,
'@

    $auditDetailsReplacement = @'
      correction_reason: correctionReason,
      previous_revocation_reason: previousRevocationReason,
      previous_jurisdiction:
        document.jurisdiction,
      reissued_jurisdiction:
        reissueJurisdiction,
      previous_document_number:
        document.document_number,
      reissued_document_number:
        reissueDocumentNumber,
      ...formatReference,
'@

    if ($reissueBlock.Contains($auditDetailsAnchor)) {
        $reissueBlock = $reissueBlock.Replace(
            $auditDetailsAnchor,
            $auditDetailsReplacement
        )
    }
}

$adminActions =
    $adminActions.Substring(0, $reissueStart) +
    $reissueBlock +
    $adminActions.Substring($nextExport)

Write-Utf8 $adminActionsPath $adminActions
Write-Host "[OK] Certificate reissue now synchronizes country, issuer snapshot, and jurisdiction-coded certificate number." -ForegroundColor Green

# ============================================================
# 3. ADMIN CERTIFICATE PAGE NOTE
# ============================================================

$adminPage = Read-Utf8 $adminCertificatePagePath

if (-not $adminPage.Contains("Certificate jurisdiction source")) {
    $headingAnchor = @'
          <h2 className="text-2xl font-black">Certificate register</h2>
'@

    $note = @'
          <h2 className="text-2xl font-black">Certificate register</h2>

          <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-black">
              Certificate jurisdiction source
            </p>
            <p className="mt-1">
              The issuing jurisdiction follows the country selected for the participant in Registration Management.
              Change Pakistan / Saudi Arabia / China there before previewing and reissuing a revoked certificate.
            </p>
            <Link
              href="/manager/registrations"
              className="mt-3 inline-flex rounded-xl bg-blue-900 px-4 py-2 text-xs font-black text-white"
            >
              Open Registration Management
            </Link>
          </div>
'@

    if ($adminPage.Contains($headingAnchor)) {
        $adminPage = $adminPage.Replace(
            $headingAnchor,
            $note
        )
    }
}

Write-Utf8 $adminCertificatePagePath $adminPage

# ============================================================
# 4. Clear cache + typecheck
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
Write-Host "CERTIFICATE JURISDICTION SYNC ENABLED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""
Write-Host "No Supabase migration is required." -ForegroundColor Cyan
Write-Host ""
Write-Host "Then run:" -ForegroundColor Yellow
Write-Host "  npm.cmd run build"
Write-Host "  npm.cmd run dev"
Write-Host ""
Write-Host "Behavior:" -ForegroundColor Cyan
Write-Host "  Registration country PK -> certificate shows Pakistan / LD-C-PK..."
Write-Host "  Registration country SA -> certificate shows Saudi Arabia / LD-C-SA..."
Write-Host "  Registration country CN -> certificate shows China / LD-C-CN..."
Write-Host ""
Write-Host "For a revoked certificate:" -ForegroundColor Cyan
Write-Host "  Change country in Registration Management"
Write-Host "  Preview corrected certificate"
Write-Host "  Reissue"
Write-Host "  Jurisdiction + issuer snapshot + country-coded document number are synchronized"
Write-Host "  Verification code and document record remain the same"

$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\receipt-issuer-stamp-$timestamp"

$adminActionsPath = Join-Path $root "app\admin\documents\actions.ts"
$adminReceiptPagePath = Join-Path $root "app\admin\documents\receipts\page.tsx"
$documentPagePath = Join-Path $root "app\documents\[id]\page.tsx"
$componentPath = Join-Path $root "components\admin\IssuerReceiptStampEditor.tsx"
$migrationPath = Join-Path $root "supabase\migrations\20260823_receipt_issuer_stamp.sql"

foreach ($path in @(
    $adminActionsPath,
    $adminReceiptPagePath,
    $documentPagePath
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

    New-Item -ItemType Directory `
        -Path (Split-Path -Parent $Path) `
        -Force |
        Out-Null

    [System.IO.File]::WriteAllText(
        $Path,
        $Content,
        $utf8
    )
}

# ============================================================
# 1. Migration: issuer stamp fields + storage bucket
# ============================================================

Backup-File $migrationPath

$migration = @'
begin;

alter table public.document_issuer_profiles
  add column if not exists receipt_stamp_url text,
  add column if not exists receipt_stamp_storage_path text,
  add column if not exists receipt_stamp_mime_type text,
  add column if not exists receipt_stamp_enabled boolean not null default false,
  add column if not exists receipt_stamp_updated_at timestamptz;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'issuer-assets',
  'issuer-assets',
  true,
  5242880,
  array[
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';

commit;
'@

Write-Utf8 $migrationPath $migration
Write-Host "[OK] Created receipt stamp migration." -ForegroundColor Green

# ============================================================
# 2. Admin stamp editor component
# ============================================================

Backup-File $componentPath

$component = @'
type ServerAction = (
  formData: FormData
) => void | Promise<void>;

export function IssuerReceiptStampEditor({
  jurisdiction,
  jurisdictionName,
  issuerName,
  stampUrl,
  stampEnabled,
  uploadAction,
  removeAction,
}: {
  jurisdiction: "PK" | "SA" | "CN";
  jurisdictionName: string;
  issuerName: string;
  stampUrl?: string | null;
  stampEnabled?: boolean | null;
  uploadAction: ServerAction;
  removeAction: ServerAction;
}) {
  const active =
    Boolean(stampEnabled) &&
    Boolean(stampUrl);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            {jurisdictionName} issuer stamp
          </p>

          <h3 className="mt-2 text-xl font-black">
            {issuerName}
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This stamp is stored on the issuer profile and is snapshotted
            into newly issued receipts. Replacing or disabling it does not
            modify receipts that were already issued.
          </p>
        </div>

        <span
          className={`h-fit rounded-full px-3 py-1 text-xs font-black ${
            active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {active ? "Stamp active" : "No active stamp"}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          {active && stampUrl ? (
            <img
              src={stampUrl}
              alt={`${issuerName} receipt stamp`}
              className="max-h-40 max-w-full object-contain"
              style={{ mixBlendMode: "multiply" }}
            />
          ) : (
            <p className="text-center text-sm font-bold text-slate-400">
              No stamp uploaded
            </p>
          )}
        </div>

        <div className="space-y-4">
          <form
            action={uploadAction}
            encType="multipart/form-data"
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <input
              type="hidden"
              name="jurisdiction"
              value={jurisdiction}
            />

            <label className="grid gap-2 text-sm font-black text-slate-700">
              Upload official issuer stamp
              <input
                type="file"
                name="stamp_file"
                accept="image/png,image/jpeg,image/webp"
                required
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
              />
            </label>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              PNG, JPG, or WebP; maximum 5 MB. A tightly cropped transparent
              PNG gives the cleanest printed result. A normal stamp photo is
              also accepted.
            </p>

            <button className="mt-4 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-black text-white">
              {active ? "Replace active stamp" : "Upload and activate stamp"}
            </button>
          </form>

          {active ? (
            <form action={removeAction}>
              <input
                type="hidden"
                name="jurisdiction"
                value={jurisdiction}
              />

              <button className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700">
                Disable stamp for future receipts
              </button>

              <p className="mt-2 text-xs text-slate-500">
                Existing issued receipts keep their saved stamp snapshot.
              </p>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}
'@

Write-Utf8 $componentPath $component
Write-Host "[OK] Created issuer stamp admin component." -ForegroundColor Green

# ============================================================
# 3. Add upload/disable actions
# ============================================================

Backup-File $adminActionsPath
$adminActions = Read-Utf8 $adminActionsPath

if (-not $adminActions.Contains("uploadReceiptIssuerStampAction")) {
    $insertMarker = 'export async function updateReceiptFormatAction'

    $markerIndex = $adminActions.IndexOf($insertMarker)

    if ($markerIndex -lt 0) {
        throw "Could not locate updateReceiptFormatAction in app/admin/documents/actions.ts."
    }

    $stampActions = @'
const RECEIPT_STAMP_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export async function uploadReceiptIssuerStampAction(
  formData: FormData
) {
  const auth =
    await requireAdmin(
      "/admin/documents/receipts"
    );

  const jurisdiction =
    normalizeJurisdiction(
      field(formData, "jurisdiction")
    );

  const file =
    formData.get(
      "stamp_file"
    ) as File | null;

  if (!file || file.size === 0) {
    redirect(
      receiptBack(
        "error",
        "Choose a stamp image to upload."
      )
    );
  }

  if (
    !RECEIPT_STAMP_TYPES.has(
      file.type
    )
  ) {
    redirect(
      receiptBack(
        "error",
        "Receipt stamp must be PNG, JPG, or WebP."
      )
    );
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {
    redirect(
      receiptBack(
        "error",
        "Receipt stamp must be 5 MB or smaller."
      )
    );
  }

  const { data: issuer } =
    await auth.admin
      .from(
        "document_issuer_profiles"
      )
      .select(
        "jurisdiction"
      )
      .eq(
        "jurisdiction",
        jurisdiction
      )
      .maybeSingle();

  if (!issuer) {
    redirect(
      receiptBack(
        "error",
        "Configure the issuer profile before uploading a stamp."
      )
    );
  }

  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";

  const storagePath =
    `${jurisdiction}/receipt-stamps/` +
    `${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } =
    await auth.admin.storage
      .from("issuer-assets")
      .upload(
        storagePath,
        await file.arrayBuffer(),
        {
          contentType: file.type,
          upsert: false,
          cacheControl: "31536000",
        }
      );

  if (uploadError) {
    redirect(
      receiptBack(
        "error",
        uploadError.message
      )
    );
  }

  const { data: publicUrl } =
    auth.admin.storage
      .from("issuer-assets")
      .getPublicUrl(
        storagePath
      );

  const now =
    new Date().toISOString();

  const { error } =
    await auth.admin
      .from(
        "document_issuer_profiles"
      )
      .update({
        receipt_stamp_url:
          publicUrl.publicUrl,
        receipt_stamp_storage_path:
          storagePath,
        receipt_stamp_mime_type:
          file.type,
        receipt_stamp_enabled:
          true,
        receipt_stamp_updated_at:
          now,
        updated_by:
          auth.user.id,
        updated_at:
          now,
      })
      .eq(
        "jurisdiction",
        jurisdiction
      );

  if (error) {
    redirect(
      receiptBack(
        "error",
        error.message
      )
    );
  }

  refresh();

  redirect(
    receiptBack(
      "message",
      `${jurisdiction} receipt stamp uploaded and activated.`
    )
  );
}

export async function disableReceiptIssuerStampAction(
  formData: FormData
) {
  const auth =
    await requireAdmin(
      "/admin/documents/receipts"
    );

  const jurisdiction =
    normalizeJurisdiction(
      field(formData, "jurisdiction")
    );

  const now =
    new Date().toISOString();

  const { error } =
    await auth.admin
      .from(
        "document_issuer_profiles"
      )
      .update({
        receipt_stamp_enabled:
          false,
        receipt_stamp_updated_at:
          now,
        updated_by:
          auth.user.id,
        updated_at:
          now,
      })
      .eq(
        "jurisdiction",
        jurisdiction
      );

  if (error) {
    redirect(
      receiptBack(
        "error",
        error.message
      )
    );
  }

  refresh();

  redirect(
    receiptBack(
      "message",
      `${jurisdiction} receipt stamp disabled for future receipts.`
    )
  );
}


'@

    $adminActions =
        $adminActions.Insert(
            $markerIndex,
            $stampActions
        )

    Write-Utf8 $adminActionsPath $adminActions
    Write-Host "[OK] Added receipt stamp upload/disable actions." -ForegroundColor Green
}
else {
    Write-Host "[OK] Receipt stamp actions already exist." -ForegroundColor DarkGreen
}

# ============================================================
# 4. Admin receipt page: import editor/actions and render
# ============================================================

Backup-File $adminReceiptPagePath
$receiptAdminPage = Read-Utf8 $adminReceiptPagePath

if (-not $receiptAdminPage.Contains("IssuerReceiptStampEditor")) {
    $importAnchor =
        'import { ReceiptFormatEditor } from "@/components/admin/ReceiptFormatEditor";'

    if (-not $receiptAdminPage.Contains($importAnchor)) {
        throw "Could not locate ReceiptFormatEditor import in admin receipt page."
    }

    $receiptAdminPage =
        $receiptAdminPage.Replace(
            $importAnchor,
            $importAnchor + "`r`n" +
            'import { IssuerReceiptStampEditor } from "@/components/admin/IssuerReceiptStampEditor";'
        )
}

# Add actions to existing ../actions import.
if (-not $receiptAdminPage.Contains("uploadReceiptIssuerStampAction")) {
    $actionsImportPattern =
        'import\s*\{([\s\S]*?)\}\s*from\s*["'']\.\./actions["''];'

    $actionsImportRegex =
        [System.Text.RegularExpressions.Regex]::new(
            $actionsImportPattern,
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )

    $match =
        $actionsImportRegex.Match(
            $receiptAdminPage
        )

    if (-not $match.Success) {
        throw "Could not locate ../actions import in admin receipt page."
    }

    $existingBody =
        $match.Groups[1].Value

    $newBody =
        $existingBody.TrimEnd() +
        "`r`n  uploadReceiptIssuerStampAction," +
        "`r`n  disableReceiptIssuerStampAction,"

    $replacement =
        "import {" +
        $newBody +
        "`r`n} from `"../actions`";"

    $receiptAdminPage =
        $actionsImportRegex.Replace(
            $receiptAdminPage,
            $replacement,
            1
        )
}

# Extend issuer select to include stamp fields.
$receiptAdminPage =
    $receiptAdminPage.Replace(
        '"jurisdiction,legal_name,trading_name"',
        '"jurisdiction,legal_name,trading_name,receipt_stamp_url,receipt_stamp_enabled"'
    )

# Insert stamp-management section before receipt format section.
if (-not $receiptAdminPage.Contains("Issuer stamps")) {
    $formatSectionAnchor =
        '<section className="mt-10 space-y-8">'

    $anchorIndex =
        $receiptAdminPage.IndexOf(
            $formatSectionAnchor
        )

    if ($anchorIndex -lt 0) {
        throw "Could not locate receipt-format section in admin receipt page."
    }

    $stampSection = @'
<section className="mt-12">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              Issuer authentication
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Issuer stamps
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Upload the company stamp used on future official payment receipts.
              Each jurisdiction has its own issuer stamp.
            </p>
          </div>

          <div className="mt-5 space-y-5">
            {jurisdictions.map(
              (jurisdiction) => {
                const issuer: any =
                  issuerByJurisdiction.get(
                    jurisdiction
                  );

                return (
                  <IssuerReceiptStampEditor
                    key={jurisdiction}
                    jurisdiction={
                      jurisdiction
                    }
                    jurisdictionName={
                      jurisdictionNames[
                        jurisdiction
                      ]
                    }
                    issuerName={
                      issuer?.trading_name ||
                      issuer?.legal_name ||
                      "LexData Research & Training"
                    }
                    stampUrl={
                      issuer?.receipt_stamp_url
                    }
                    stampEnabled={
                      issuer?.receipt_stamp_enabled
                    }
                    uploadAction={
                      uploadReceiptIssuerStampAction
                    }
                    removeAction={
                      disableReceiptIssuerStampAction
                    }
                  />
                );
              }
            )}
          </div>
        </section>



'@

    $receiptAdminPage =
        $receiptAdminPage.Insert(
            $anchorIndex,
            $stampSection
        )
}

Write-Utf8 $adminReceiptPagePath $receiptAdminPage
Write-Host "[OK] Added stamp management to admin receipt workspace." -ForegroundColor Green

# ============================================================
# 5. Receipt rendering: use issuer snapshot stamp
# ============================================================

Backup-File $documentPagePath
$documentPage = Read-Utf8 $documentPagePath

if (-not $documentPage.Contains("Authorized issuer stamp")) {
    $classificationPattern = @'
(<section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs leading-6 text-amber-950">[\s\S]*?</section>)
'@

    $classificationRegex =
        [System.Text.RegularExpressions.Regex]::new(
            $classificationPattern,
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )

    $match =
        $classificationRegex.Match(
            $documentPage
        )

    if (-not $match.Success) {
        throw "Could not locate receipt classification section in app/documents/[id]/page.tsx."
    }

    $stampRender = @'

          {issuerData.receipt_stamp_enabled &&
          issuerData.receipt_stamp_url ? (
            <section className="mt-8 flex justify-end">
              <div className="w-44 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Authorized issuer stamp
                </p>

                <img
                  src={issuerData.receipt_stamp_url}
                  alt={`${issuerData.legal_name || "Issuer"} stamp`}
                  className="mx-auto mt-2 h-32 w-40 object-contain"
                  style={{
                    mixBlendMode: "multiply",
                  }}
                />

                <p className="mt-1 text-[10px] font-bold text-slate-500">
                  {issuerData.legal_name ||
                    "Authorized issuer"}
                </p>
              </div>
            </section>
          ) : null}
'@

    $replacement =
        $match.Groups[1].Value +
        $stampRender

    $documentPage =
        $classificationRegex.Replace(
            $documentPage,
            $replacement,
            1
        )

    Write-Utf8 $documentPagePath $documentPage
    Write-Host "[OK] Added issuer stamp to printed receipt rendering." -ForegroundColor Green
}
else {
    Write-Host "[OK] Receipt stamp rendering already exists." -ForegroundColor DarkGreen
}

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
Write-Host "RECEIPT ISSUER STAMP SYSTEM INSTALLED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""
Write-Host "REQUIRED DATABASE STEP:" -ForegroundColor Yellow
Write-Host "Run in Supabase SQL Editor:"
Write-Host "  supabase\migrations\20260823_receipt_issuer_stamp.sql"
Write-Host ""
Write-Host "Then:" -ForegroundColor Cyan
Write-Host "  npm.cmd run build"
Write-Host "  npm.cmd run dev"
Write-Host ""
Write-Host "Admin workflow:" -ForegroundColor Cyan
Write-Host "  1. Open /admin/documents/receipts"
Write-Host "  2. Find Issuer stamps"
Write-Host "  3. Upload the stamp under the correct PK / SA / CN issuer"
Write-Host "  4. New receipts snapshot and display that stamp"
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "Replacing/disabling a stamp affects future receipts only."
Write-Host "Previously issued receipts keep the stamp URL stored in issuer_snapshot."

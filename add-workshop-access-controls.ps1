$ErrorActionPreference = "Stop"

# ============================================================
# PATHS
# ============================================================

$root = Get-Location

$pagePath = Join-Path $root "app\manager\registrations\page.tsx"
$actionsPath = Join-Path $root "app\admin\registrations\actions.ts"
$migrationDir = Join-Path $root "supabase\migrations"
$migrationPath = Join-Path $migrationDir "006_workshop_access_control.sql"

if (-not (Test-Path $pagePath)) {
    throw "Cannot find: $pagePath"
}

if (-not (Test-Path $actionsPath)) {
    throw "Cannot find: $actionsPath"
}

# ============================================================
# BACKUP
# ============================================================

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$pageBackup = "$pagePath.backup-$timestamp"
$actionsBackup = "$actionsPath.backup-$timestamp"

Copy-Item $pagePath $pageBackup -Force
Copy-Item $actionsPath $actionsBackup -Force

Write-Host ""
Write-Host "Backups created:" -ForegroundColor Cyan
Write-Host $pageBackup
Write-Host $actionsBackup
Write-Host ""

# ============================================================
# HELPER
# ============================================================

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# ============================================================
# 1. PATCH SERVER ACTIONS
# ============================================================

$actions = Get-Content -LiteralPath $actionsPath -Raw

# ------------------------------------------------------------
# Confirm registration should also grant workshop access
# ------------------------------------------------------------

if (
    $actions -match 'registration_status:\s*"confirmed"' -and
    $actions -notmatch 'registration_status:\s*"confirmed",\s*payment_status:\s*"confirmed",\s*access_status:\s*"granted"'
) {
    $actions = [regex]::Replace(
        $actions,
        'registration_status:\s*"confirmed",\s*\r?\n\s*payment_status:\s*"confirmed",',
        @'
registration_status: "confirmed",
      payment_status: "confirmed",
      access_status: "granted",
'@,
        1
    )

    Write-Host "Updated Confirm action: Confirm now grants access." -ForegroundColor Green
}

# ------------------------------------------------------------
# Reject registration should explicitly revoke access
# ------------------------------------------------------------

if (
    $actions -match 'registration_status:\s*"rejected"' -and
    $actions -notmatch 'registration_status:\s*"rejected",\s*payment_status:\s*"rejected",\s*access_status:\s*"revoked"'
) {
    $actions = [regex]::Replace(
        $actions,
        'registration_status:\s*"rejected",\s*\r?\n\s*payment_status:\s*"rejected",',
        @'
registration_status: "rejected",
      payment_status: "rejected",
      access_status: "revoked",
'@,
        1
    )

    Write-Host "Updated Reject action: Reject now revokes access." -ForegroundColor Green
}

# ------------------------------------------------------------
# Add explicit Grant/Revoke server actions
# ------------------------------------------------------------

if ($actions -notmatch 'export async function grantWorkshopAccessAction') {

    $newActions = @'


export async function grantWorkshopAccessAction(formData: FormData) {
  const auth = await requireManagerOrAdmin("/manager/registrations");
  const id = readText(formData, "id");

  if (!id) {
    redirect("/manager/registrations?message=Missing registration id");
  }

  const { error } = await auth.admin
    .from("workshop_registrations")
    .update({
      access_status: "granted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/manager/registrations?message=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/my/workshops");

  redirect(
    "/manager/registrations?message=Workshop access granted"
  );
}


export async function revokeWorkshopAccessAction(formData: FormData) {
  const auth = await requireManagerOrAdmin("/manager/registrations");
  const id = readText(formData, "id");

  if (!id) {
    redirect("/manager/registrations?message=Missing registration id");
  }

  const { error } = await auth.admin
    .from("workshop_registrations")
    .update({
      access_status: "revoked",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/manager/registrations?message=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/my/workshops");

  redirect(
    "/manager/registrations?message=Workshop access revoked"
  );
}
'@

    $actions += $newActions

    Write-Host "Added Grant Access and Revoke Access server actions." -ForegroundColor Green
}

[System.IO.File]::WriteAllText(
    $actionsPath,
    $actions,
    $utf8NoBom
)

# ============================================================
# 2. PATCH MANAGER REGISTRATION PAGE
# ============================================================

$page = Get-Content -LiteralPath $pagePath -Raw

# ------------------------------------------------------------
# Add new action imports
# ------------------------------------------------------------

if ($page -notmatch 'grantWorkshopAccessAction') {

    $page = $page.Replace(
        'sendRegistrationMessageAction,',
        @'
sendRegistrationMessageAction,
  grantWorkshopAccessAction,
  revokeWorkshopAccessAction,
'@
    )

    Write-Host "Added access-action imports." -ForegroundColor Green
}

# ------------------------------------------------------------
# Add access parameter to SearchParams
# ------------------------------------------------------------

if ($page -notmatch 'access\?: string;') {

    $page = $page.Replace(
        'payment?: string;',
        @'
payment?: string;
  access?: string;
'@
    )
}

# ------------------------------------------------------------
# Preserve access parameter when paginating
# ------------------------------------------------------------

if ($page -notmatch 'if \(params\.access\) next\.set\("access"') {

    $page = $page.Replace(
        'if (params.payment) next.set("payment", params.payment);',
        @'
if (params.payment) next.set("payment", params.payment);
  if (params.access) next.set("access", params.access);
'@
    )
}

# ------------------------------------------------------------
# Add access database filter
# ------------------------------------------------------------

if ($page -notmatch 'query = query\.eq\("access_status"') {

    $needle = @'
  if (params.payment && params.payment !== "all") {
    query = query.eq("payment_status", params.payment);
  }
'@

    $replacement = @'
  if (params.payment && params.payment !== "all") {
    query = query.eq("payment_status", params.payment);
  }

  if (params.access && params.access !== "all") {
    query = query.eq("access_status", params.access);
  }
'@

    if ($page.Contains($needle)) {
        $page = $page.Replace($needle, $replacement)
        Write-Host "Added access-status database filter." -ForegroundColor Green
    }
}

# ------------------------------------------------------------
# Make filter grid fit extra field
# ------------------------------------------------------------

$page = $page.Replace(
    'md:grid-cols-[1fr_180px_180px_auto]',
    'md:grid-cols-[1fr_160px_160px_160px_auto]'
)

# ------------------------------------------------------------
# Add Access filter after Payment select
# ------------------------------------------------------------

if ($page -notmatch 'name="access"') {

    $paymentSelectPattern = '(?s)(<select name="payment".*?</select>)'

    if ($page -match $paymentSelectPattern) {

        $accessSelect = @'

          <select
            name="access"
            defaultValue={params.access || "all"}
            className="rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="all">All access</option>
            <option value="granted">Unlocked</option>
            <option value="revoked">Revoked</option>
            <option value="pending">Locked / Pending</option>
          </select>
'@

        $page = [regex]::Replace(
            $page,
            $paymentSelectPattern,
            '$1' + $accessSelect,
            1
        )

        Write-Host "Added Access filter." -ForegroundColor Green
    }
}

# ------------------------------------------------------------
# Change map to a block so we can calculate access state
# ------------------------------------------------------------

if ($page -match '\{registrations\.map\(\(r: any\) => \(') {

    $page = $page.Replace(
        '{registrations.map((r: any) => (',
        @'
{registrations.map((r: any) => {
            const rawAccess = String(r.access_status || "").toLowerCase();

            const explicitlyRevoked = [
              "revoked",
              "blocked",
              "denied",
              "suspended",
            ].includes(rawAccess);

            const hasAccess =
              !explicitlyRevoked &&
              (
                rawAccess === "granted" ||
                r.payment_status === "confirmed" ||
                r.payment_status === "paid"
              );

            const accessLabel = explicitlyRevoked
              ? "Revoked"
              : hasAccess
                ? "Unlocked"
                : "Locked";

            const accessClass = explicitlyRevoked
              ? "bg-red-50 text-red-700 border-red-100"
              : hasAccess
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-amber-50 text-amber-700 border-amber-100";

            return (
'@
    )

    # Close the return block correctly
    $page = $page.Replace(
        '          ))}',
        @'
            );
          })}
'@
    )

    Write-Host "Added participant access calculation." -ForegroundColor Green
}

# ------------------------------------------------------------
# Add labelled status badges
# ------------------------------------------------------------

$oldBadges = @'
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${badge(r.registration_status)}`}>{r.registration_status || "pending"}</span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${badge(r.payment_status)}`}>{r.payment_status || "pending"}</span>
'@

$newBadges = @'
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${badge(r.registration_status)}`}>
                      Registration: {r.registration_status || "pending"}
                    </span>

                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${badge(r.payment_status)}`}>
                      Payment: {r.payment_status || "pending"}
                    </span>

                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${accessClass}`}>
                      Access: {accessLabel}
                    </span>
'@

if ($page.Contains($oldBadges)) {
    $page = $page.Replace($oldBadges, $newBadges)
    Write-Host "Added visible participant Access status badge." -ForegroundColor Green
}

# ------------------------------------------------------------
# Add Workshop Access panel before Message registrant
# ------------------------------------------------------------

if ($page -notmatch '>Workshop access<') {

    $messageFormNeedle = @'
                  <form action={sendRegistrationMessageAction} className="rounded-2xl bg-blue-50 p-4">
'@

    $accessPanel = @'
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Workshop access
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700">
                            Current access:
                          </span>

                          <span className={`rounded-full border px-3 py-1 text-xs font-black ${accessClass}`}>
                            {accessLabel}
                          </span>
                        </div>
                      </div>

                      {hasAccess ? (
                        <form action={revokeWorkshopAccessAction}>
                          <input type="hidden" name="id" value={r.id} />

                          <button
                            className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
                          >
                            Revoke access
                          </button>
                        </form>
                      ) : (
                        <form action={grantWorkshopAccessAction}>
                          <input type="hidden" name="id" value={r.id} />

                          <button
                            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700"
                          >
                            Grant access
                          </button>
                        </form>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Revoking access explicitly blocks this participant from protected workshop content.
                    </p>
                  </div>

'@

    if ($page.Contains($messageFormNeedle)) {

        $page = $page.Replace(
            $messageFormNeedle,
            $accessPanel + $messageFormNeedle
        )

        Write-Host "Added Workshop Access controls." -ForegroundColor Green
    }
    else {
        Write-Host "Could not find Message Registrant form insertion point." -ForegroundColor Yellow
    }
}

[System.IO.File]::WriteAllText(
    $pagePath,
    $page,
    $utf8NoBom
)

# ============================================================
# 3. CREATE DATABASE MIGRATION
# ============================================================

if (-not (Test-Path $migrationDir)) {
    New-Item -ItemType Directory -Path $migrationDir -Force | Out-Null
}

$migration = @'
-- Workshop explicit access control

alter table public.workshop_registrations
add column if not exists access_status text;

alter table public.workshop_registrations
drop constraint if exists workshop_registrations_access_status_check;

alter table public.workshop_registrations
add constraint workshop_registrations_access_status_check
check (
  access_status is null
  or access_status in (
    'pending',
    'granted',
    'revoked',
    'blocked',
    'denied',
    'suspended'
  )
);

create index if not exists workshop_registrations_access_status_idx
on public.workshop_registrations(access_status);

-- Existing confirmed/paid users keep access unless they were explicitly revoked.
update public.workshop_registrations
set access_status = 'granted'
where access_status is null
and (
  payment_status in ('confirmed', 'paid')
  or registration_status = 'confirmed'
);
'@

[System.IO.File]::WriteAllText(
    $migrationPath,
    $migration,
    $utf8NoBom
)

Write-Host ""
Write-Host "Migration created:" -ForegroundColor Green
Write-Host $migrationPath
Write-Host ""

# ============================================================
# 4. VALIDATE CODE
# ============================================================

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}

Write-Host "Running typecheck..." -ForegroundColor Yellow
npm.cmd run typecheck

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "TYPECHECK FAILED." -ForegroundColor Red
    Write-Host "Your original files are available here:" -ForegroundColor Yellow
    Write-Host $pageBackup
    Write-Host $actionsBackup
    exit 1
}

Write-Host ""
Write-Host "Running production build..." -ForegroundColor Yellow
npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED." -ForegroundColor Red
    Write-Host "Your original files are available here:" -ForegroundColor Yellow
    Write-Host $pageBackup
    Write-Host $actionsBackup
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "CODE PATCH SUCCESSFUL" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT NEXT STEP:" -ForegroundColor Yellow
Write-Host ""
Write-Host "The database migration still needs to be applied to Supabase:" -ForegroundColor Yellow
Write-Host $migrationPath
Write-Host ""
Write-Host "After applying the SQL migration, run:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"

$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$pagePath = Join-Path $root "app\manager\registrations\page.tsx"
$actionsPath = Join-Path $root "app\manager\actions\payment-actions.ts"
$accessControlPath = Join-Path $root "lib\access-control.ts"
$migrationDir = Join-Path $root "supabase\migrations"
$migrationPath = Join-Path $migrationDir "006_workshop_access_control.sql"

foreach ($required in @($pagePath, $actionsPath)) {
    if (-not (Test-Path $required)) {
        throw "Cannot find required file: $required`nRun this script from the project root."
    }
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$pageBackup = "$pagePath.backup-$timestamp"
$actionsBackup = "$actionsPath.backup-$timestamp"

Copy-Item $pagePath $pageBackup -Force
Copy-Item $actionsPath $actionsBackup -Force

if (Test-Path $accessControlPath) {
    Copy-Item $accessControlPath "$accessControlPath.backup-$timestamp" -Force
}

$utf8 = New-Object System.Text.UTF8Encoding($false)

function Read-Utf8([string]$Path) {
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8([string]$Path, [string]$Content) {
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

Write-Host ""
Write-Host "Backups created." -ForegroundColor Cyan
Write-Host "  $pageBackup"
Write-Host "  $actionsBackup"
Write-Host ""

# ============================================================
# 1. PATCH SHARED ACCESS GUARD
# ============================================================

$accessControl = @'
export function canAccessWorkshop(reg: any) {
  if (!reg) return false;

  const accessStatus = String(reg.access_status || "").toLowerCase();

  if (["revoked", "blocked", "denied", "suspended"].includes(accessStatus)) {
    return false;
  }

  if (accessStatus === "granted") {
    return true;
  }

  return (
    reg.registration_status === "confirmed" ||
    reg.payment_status === "confirmed" ||
    reg.payment_status === "paid" ||
    reg.payment_status === "waived"
  );
}
'@

Write-Utf8 $accessControlPath $accessControl
Write-Host "Updated lib/access-control.ts so explicit revocation overrides payment-derived access." -ForegroundColor Green

# ============================================================
# 2. PATCH MANAGER PAYMENT ACTIONS
# ============================================================

$actions = Read-Utf8 $actionsPath

# Confirm payment must explicitly grant access.
$actions = [regex]::Replace(
    $actions,
    'registration_status:\s*"confirmed",\s*(\r?\n\s*)payment_status:\s*"confirmed",',
    'registration_status: "confirmed",$1payment_status: "confirmed",$1access_status: "granted",'
)

# Waived payment must explicitly grant access.
$actions = [regex]::Replace(
    $actions,
    'registration_status:\s*"confirmed",\s*(\r?\n\s*)payment_status:\s*"waived",',
    'registration_status: "confirmed",$1payment_status: "waived",$1access_status: "granted",'
)

# Add explicit access intents to switch-based implementation.
if ($actions -match 'switch\s*\(intent\)\s*\{' -and $actions -notmatch 'case\s+"grant_access"') {
    $accessCases = @'
switch (intent) {
    case "grant_access":
      updatePayload = {
        access_status: "granted",
      };
      successMessage = "Workshop access granted.";
      notification = {
        title: "Workshop access granted",
        body: "Your workshop access has been granted by the LexData team.",
        sourceType: "access_granted",
      };
      break;

    case "revoke_access":
      updatePayload = {
        access_status: "revoked",
      };
      successMessage = "Workshop access revoked.";
      notification = {
        title: "Workshop access revoked",
        body: "Your workshop access has been revoked. Please contact the LexData team if you believe this is a mistake.",
        sourceType: "access_revoked",
      };
      break;

'@
    $actions = [regex]::Replace(
        $actions,
        'switch\s*\(intent\)\s*\{',
        [System.Text.RegularExpressions.MatchEvaluator]{
            param($m)
            return $accessCases
        },
        1
    )
    Write-Host "Added grant_access and revoke_access intents to payment-actions.ts." -ForegroundColor Green
}
elseif ($actions -notmatch 'grant_access') {
    # Support older direct-if implementation.
    $marker = 'if (!registration) return;'
    if ($actions.Contains($marker)) {
        $directHandlers = @'

  if (intent === "grant_access") {
    await admin
      .from("workshop_registrations")
      .update({
        access_status: "granted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", registrationId);

    await notifyUser({
      userId: registration.user_id,
      email: registration.email,
      title: "Workshop access granted",
      body: "Your workshop access has been granted by the LexData team.",
      sourceType: "access_granted",
      sourceId: registrationId,
    });

    await revalidateRegistrationPages(registration.workshop_id);
    return;
  }

  if (intent === "revoke_access") {
    await admin
      .from("workshop_registrations")
      .update({
        access_status: "revoked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", registrationId);

    await notifyUser({
      userId: registration.user_id,
      email: registration.email,
      title: "Workshop access revoked",
      body: "Your workshop access has been revoked. Please contact the LexData team if you believe this is a mistake.",
      sourceType: "access_revoked",
      sourceId: registrationId,
    });

    await revalidateRegistrationPages(registration.workshop_id);
    return;
  }
'@
        $actions = $actions.Replace($marker, $marker + $directHandlers)
        Write-Host "Added grant_access and revoke_access handlers to older payment-actions.ts implementation." -ForegroundColor Green
    }
    else {
        throw "Could not find a safe insertion point for grant/revoke actions in $actionsPath"
    }
}

Write-Utf8 $actionsPath $actions

# ============================================================
# 3. PATCH COMPACT MANAGER REGISTRATIONS TABLE
# ============================================================

$page = Read-Utf8 $pagePath

# Import shared access helper.
if ($page -notmatch 'from\s+"@/lib/access-control"') {
    $paymentImportPattern = 'import\s+\*\s+as\s+paymentActions\s+from\s+"@/app/manager/actions/payment-actions";'
    if ($page -match $paymentImportPattern) {
        $page = [regex]::Replace(
            $page,
            $paymentImportPattern,
            '$0' + "`r`n" + 'import { canAccessWorkshop } from "@/lib/access-control";',
            1
        )
    }
    else {
        throw "Could not find the paymentActions import in $pagePath"
    }
}

# Fix the visibly corrupted compact-list description without matching garbled bytes.
$page = [regex]::Replace(
    $page,
    '(?s)<p className="text-sm font-medium text-slate-500">\s*Compact list\..*?registration\.\s*</p>',
    @'
<p className="text-sm font-medium text-slate-500">
                    Compact list. Open Manage only when you need to edit one registration.
                  </p>
'@,
    1
)

# Add effective access calculation inside each registration row.
$workshopAnchor = 'const workshop = workshopById.get(registration.workshop_id);'
if ($page.Contains($workshopAnchor) -and $page -notmatch 'const hasWorkshopAccess\s*=\s*canAccessWorkshop\(registration\)') {
    $accessCalc = @'
const workshop = workshopById.get(registration.workshop_id);
                    const rawAccessStatus = String(
                      registration.access_status || ""
                    ).toLowerCase();
                    const explicitlyRevoked = [
                      "revoked",
                      "blocked",
                      "denied",
                      "suspended",
                    ].includes(rawAccessStatus);
                    const hasWorkshopAccess = canAccessWorkshop(registration);
                    const accessLabel = explicitlyRevoked
                      ? "Revoked"
                      : hasWorkshopAccess
                        ? "Unlocked"
                        : "Locked";
                    const accessBadgeClass = explicitlyRevoked
                      ? "border-red-200 bg-red-50 text-red-700"
                      : hasWorkshopAccess
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700";
'@
    $page = $page.Replace($workshopAnchor, $accessCalc)
    Write-Host "Added effective access-state calculation to compact registration rows." -ForegroundColor Green
}

# Add an access badge into the existing Payment table cell.
$tbodyIndex = $page.IndexOf("<tbody>")
if ($tbodyIndex -ge 0 -and $page -notmatch 'Access:\s*\{accessLabel\}') {
    $paymentStatusIndex = $page.IndexOf("registration.payment_status", $tbodyIndex)

    if ($paymentStatusIndex -ge 0) {
        $tdStart = $page.LastIndexOf("<td", $paymentStatusIndex)
        $tdEnd = $page.IndexOf("</td>", $paymentStatusIndex)

        if ($tdStart -ge 0 -and $tdEnd -gt $tdStart) {
            $cell = $page.Substring($tdStart, ($tdEnd + 5) - $tdStart)

            if ($cell -notmatch 'Access:') {
                $accessBadge = @'

                          <div className="mt-2">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${accessBadgeClass}`}
                            >
                              Access: {accessLabel}
                            </span>
                          </div>
'@
                $newCell = $cell.Replace("</td>", $accessBadge + "                        </td>")
                $page = $page.Substring(0, $tdStart) + $newCell + $page.Substring($tdEnd + 5)
                Write-Host "Added visible Access status badge under each participant's Payment status." -ForegroundColor Green
            }
        }
    }
}

# Add the access control section inside the existing Manage -> Payment actions form.
if ($page -notmatch 'Workshop access control') {
    $actionMarker = "paymentActions.handleRegistrationManagementAction"
    $actionIndex = $page.IndexOf($actionMarker)

    if ($actionIndex -lt 0) {
        throw "Could not find the existing Payment actions management form."
    }

    $formStart = $page.LastIndexOf("<form", $actionIndex)
    $formEnd = $page.IndexOf("</form>", $actionIndex)

    if ($formStart -lt 0 -or $formEnd -lt 0) {
        throw "Could not locate the existing Payment actions form boundaries."
    }

    $accessControls = @'

                                <div className="border-t border-slate-200 pt-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                                        Workshop access control
                                      </p>
                                      <div className="mt-2 flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-700">
                                          Current access:
                                        </span>
                                        <span
                                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${accessBadgeClass}`}
                                        >
                                          {accessLabel}
                                        </span>
                                      </div>
                                    </div>

                                    {hasWorkshopAccess ? (
                                      <button
                                        type="submit"
                                        name="intent"
                                        value="revoke_access"
                                        className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
                                      >
                                        Revoke access
                                      </button>
                                    ) : (
                                      <button
                                        type="submit"
                                        name="intent"
                                        value="grant_access"
                                        className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700"
                                      >
                                        Grant access
                                      </button>
                                    )}
                                  </div>

                                  <p className="mt-3 text-xs font-medium text-slate-500">
                                    Revoked access overrides confirmed registration and payment-derived access.
                                  </p>
                                </div>
'@

    $page = $page.Substring(0, $formEnd) + $accessControls + $page.Substring($formEnd)
    Write-Host "Added Grant/Revoke access controls inside the existing Manage -> Payment actions panel." -ForegroundColor Green
}

Write-Utf8 $pagePath $page

# ============================================================
# 4. CREATE IDEMPOTENT SUPABASE MIGRATION
# ============================================================

if (-not (Test-Path $migrationDir)) {
    New-Item -ItemType Directory -Path $migrationDir -Force | Out-Null
}

$migration = @'
-- Explicit workshop access override for manager/admin controls.

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
'@

Write-Utf8 $migrationPath $migration

# ============================================================
# 5. VALIDATE
# ============================================================

Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Source patch completed." -ForegroundColor Green
Write-Host "Migration file: $migrationPath" -ForegroundColor Cyan
Write-Host ""

$packageJsonPath = Join-Path $root "package.json"
$packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
$scripts = $packageJson.scripts

if ($null -ne $scripts -and $scripts.PSObject.Properties.Name -contains "typecheck") {
    Write-Host "Running npm typecheck..." -ForegroundColor Yellow
    npm.cmd run typecheck
}
elseif (Test-Path (Join-Path $root "tsconfig.json")) {
    Write-Host "No npm typecheck script. Running npx.cmd tsc --noEmit..." -ForegroundColor Yellow
    npx.cmd tsc --noEmit
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "TypeScript validation failed." -ForegroundColor Red
    Write-Host "Backups:" -ForegroundColor Yellow
    Write-Host "  $pageBackup"
    Write-Host "  $actionsBackup"
    exit 1
}

if ($null -ne $scripts -and $scripts.PSObject.Properties.Name -contains "build") {
    Write-Host ""
    Write-Host "Running production build..." -ForegroundColor Yellow
    npm.cmd run build

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Build failed." -ForegroundColor Red
        Write-Host "Backups:" -ForegroundColor Yellow
        Write-Host "  $pageBackup"
        Write-Host "  $actionsBackup"
        exit 1
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "COMPACT REGISTRATION ACCESS PATCH COMPLETE" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "The registration list now shows Access status under Payment." -ForegroundColor Cyan
Write-Host "Open Manage -> Payment actions to Grant or Revoke access." -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Apply this SQL migration to Supabase if access_status does not already exist:" -ForegroundColor Yellow
Write-Host "  $migrationPath"
Write-Host ""
Write-Host "Then start/restart the app with:" -ForegroundColor Cyan
Write-Host "  npm.cmd run dev"

$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$pagePath = Join-Path $root "app\manager\registrations\page.tsx"
$actionsPath = Join-Path $root "app\manager\actions\payment-actions.ts"

foreach ($path in @($pagePath, $actionsPath)) {
    if (-not (Test-Path $path)) {
        throw "Cannot find required file: $path`nRun this script from the project root."
    }
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$pageBackup = "$pagePath.backup-$timestamp"
$actionsBackup = "$actionsPath.backup-$timestamp"

Copy-Item $pagePath $pageBackup -Force
Copy-Item $actionsPath $actionsBackup -Force

$utf8 = New-Object System.Text.UTF8Encoding($false)

function Read-Text([string]$Path) {
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-Text([string]$Path, [string]$Content) {
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

Write-Host ""
Write-Host "Backups created:" -ForegroundColor Cyan
Write-Host "  $pageBackup"
Write-Host "  $actionsBackup"
Write-Host ""

# ============================================================
# 1. PATCH PAGE: BUILD CURRENT RETURN URL
# ============================================================

$page = Read-Text $pagePath

if ($page -notmatch 'const\s+currentReturnTo\s*=') {

    $pattern = 'const\s+resolvedSearchParams\s*=\s*searchParams\s*\?\s*await\s+searchParams\s*:\s*\{\};'

    if ($page -notmatch $pattern) {
        throw "Could not find resolvedSearchParams initialization in page.tsx."
    }

    $replacement = @'
const resolvedSearchParams = searchParams ? await searchParams : {};

    const currentReturnParams = new URLSearchParams();

    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (key === "message" || key === "error") continue;

      if (typeof value === "string" && value) {
        currentReturnParams.set(key, value);
      }
    }

    const currentReturnQuery = currentReturnParams.toString();

    const currentReturnTo = currentReturnQuery
      ? `/manager/registrations?${currentReturnQuery}`
      : "/manager/registrations";
'@

    $page = [regex]::Replace(
        $page,
        $pattern,
        [System.Text.RegularExpressions.MatchEvaluator]{
            param($m)
            return $replacement
        },
        1
    )

    Write-Host "Added currentReturnTo helper." -ForegroundColor Green
}
else {
    Write-Host "currentReturnTo helper already exists." -ForegroundColor Yellow
}

# ============================================================
# 2. PATCH PAGE: ADD return_to HIDDEN INPUT
#    Insert it after registration_id hidden input in management forms.
# ============================================================

if ($page -notmatch 'name="return_to"') {

    $registrationIdPattern = '(?s)(<input\s+type="hidden"\s+name="registration_id"\s+value=\{registration\.id\}\s*/>)'

    if ($page -notmatch $registrationIdPattern) {
        # More flexible ordering/whitespace match
        $registrationIdPattern = '(?s)(<input\b(?=[^>]*type="hidden")(?=[^>]*name="registration_id")(?=[^>]*value=\{registration\.id\})[^>]*/>)'
    }

    if ($page -notmatch $registrationIdPattern) {
        throw "Could not find the registration_id hidden input in the Payment actions form."
    }

    $returnInput = @'

                                <input
                                  type="hidden"
                                  name="return_to"
                                  value={currentReturnTo}
                                />
'@

    $page = [regex]::Replace(
        $page,
        $registrationIdPattern,
        '$1' + $returnInput,
        1
    )

    Write-Host "Added hidden return_to field to Payment actions form." -ForegroundColor Green
}
else {
    # If one exists but is not using currentReturnTo, normalize it.
    $page = [regex]::Replace(
        $page,
        '(?s)(<input\b(?=[^>]*name="return_to")[^>]*?)value=(?:"[^"]*"|\{[^}]*\})([^>]*/>)',
        '$1value={currentReturnTo}$2',
        1
    )

    Write-Host "Updated existing return_to field to preserve current page and filters." -ForegroundColor Green
}

Write-Text $pagePath $page

# ============================================================
# 3. PATCH SERVER ACTION: READ return_to
# ============================================================

$actions = Read-Text $actionsPath

# Add safeReturnTo helper if missing.
if ($actions -notmatch 'function\s+safeReturnTo\s*\(') {

    $helperAnchor = 'function text(formData: FormData, key: string)'

    if ($actions -match $helperAnchor) {
        $helper = @'
function safeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/manager/registrations";
  }

  return value;
}

'@

        $idx = $actions.IndexOf("function text(formData: FormData, key: string)")
        $actions = $actions.Substring(0, $idx) + $helper + $actions.Substring($idx)

        Write-Host "Added safeReturnTo helper to payment-actions.ts." -ForegroundColor Green
    }
}

# Add returnTo variable at start of action if missing.
if ($actions -notmatch 'const\s+returnTo\s*=\s*safeReturnTo') {

    $functionPattern = 'export\s+async\s+function\s+handleRegistrationManagementAction\s*\(formData:\s*FormData\)\s*\{'

    if ($actions -match $functionPattern) {

        $functionReplacement = @'
export async function handleRegistrationManagementAction(formData: FormData) {
  const returnTo = safeReturnTo(
    String(formData.get("return_to") || "/manager/registrations")
  );
'@

        $actions = [regex]::Replace(
            $actions,
            $functionPattern,
            [System.Text.RegularExpressions.MatchEvaluator]{
                param($m)
                return $functionReplacement
            },
            1
        )

        Write-Host "Added returnTo handling to server action." -ForegroundColor Green
    }
    else {
        Write-Host "Could not find handleRegistrationManagementAction declaration. Server action may already use another structure." -ForegroundColor Yellow
    }
}
else {
    Write-Host "Server action already reads return_to." -ForegroundColor Yellow
}

# ============================================================
# 4. PATCH REDIRECTS TO PRESERVE CURRENT PAGE
# ============================================================

# If the file already uses withMessage(returnTo...), leave it alone.
if ($actions -match 'withMessage\(returnTo') {
    Write-Host "Server action already redirects using returnTo." -ForegroundColor Green
}
else {

    # Add withMessage helper if needed.
    if ($actions -notmatch 'function\s+withMessage\s*\(') {
        $insertBefore = 'export async function handleRegistrationManagementAction'

        if ($actions.Contains($insertBefore)) {
            $helper = @'
function withMessage(path: string, key: "message" | "error", message: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(message)}`;
}

'@
            $actions = $actions.Replace($insertBefore, $helper + $insertBefore)
        }
    }

    # Replace common success redirect pattern.
    $actions = [regex]::Replace(
        $actions,
        'redirect\(\s*"/manager/registrations\?message="\s*\+\s*encodeURIComponent\(([^)]+)\)\s*\);',
        'redirect(withMessage(returnTo, "message", $1));'
    )

    $actions = [regex]::Replace(
        $actions,
        'redirect\(\s*`/manager/registrations\?message=\$\{encodeURIComponent\(([^)]+)\)\}`\s*\);',
        'redirect(withMessage(returnTo, "message", $1));'
    )

    # Replace simple redirect back to base page.
    $actions = $actions.Replace(
        'redirect("/manager/registrations");',
        'redirect(returnTo);'
    )

    # Replace common error redirect forms.
    $actions = [regex]::Replace(
        $actions,
        'redirect\(\s*"/manager/registrations\?error="\s*\+\s*encodeURIComponent\(([^)]+)\)\s*\);',
        'redirect(withMessage(returnTo, "error", $1));'
    )

    Write-Host "Patched common redirects to preserve the current page and filters." -ForegroundColor Green
}

Write-Text $actionsPath $actions

# ============================================================
# 5. VALIDATE
# ============================================================

Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue

$packageJsonPath = Join-Path $root "package.json"
$packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
$scripts = $packageJson.scripts

Write-Host ""
Write-Host "Running TypeScript validation..." -ForegroundColor Yellow

if ($null -ne $scripts -and $scripts.PSObject.Properties.Name -contains "typecheck") {
    npm.cmd run typecheck
}
elseif (Test-Path (Join-Path $root "tsconfig.json")) {
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

Write-Host ""
Write-Host "SUCCESS." -ForegroundColor Green
Write-Host ""
Write-Host "Status/payment/access updates will now return to the current registration page" -ForegroundColor Cyan
Write-Host "while preserving page number, page size, search, workshop and status filters." -ForegroundColor Cyan
Write-Host ""
Write-Host "Restart the app if needed:" -ForegroundColor Yellow
Write-Host "  npm.cmd run dev"

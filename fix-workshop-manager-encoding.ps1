$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$path = Join-Path $root "components\admin\WorkshopScheduleManager.tsx"

if (-not (Test-Path $path)) {
    throw "Cannot find: $path`nRun this script from the project root."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = "$path.backup-$timestamp"
Copy-Item $path $backup -Force

$utf8 = New-Object System.Text.UTF8Encoding($false)
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$replacements = @(
    @{
        Name = "Date readiness"
        Pattern = '(?s)<p\s+className=\{\s*session\.session_date.*?Date configured\s*</p>'
        Replacement = @'
<p
                              className={
                                session.session_date
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }
                            >
                              {session.session_date ? "[OK]" : "[!]"} Date configured
                            </p>
'@
    },
    @{
        Name = "Time readiness"
        Pattern = '(?s)<p\s+className=\{\s*session\.start_time\s*&&\s*session\.end_time.*?Time configured\s*</p>'
        Replacement = @'
<p
                              className={
                                session.start_time && session.end_time
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }
                            >
                              {session.start_time && session.end_time
                                ? "[OK]"
                                : "[!]"}{" "}
                              Time configured
                            </p>
'@
    },
    @{
        Name = "Meeting-link readiness"
        Pattern = '(?s)<p\s+className=\{\s*session\.meeting_url.*?Meeting link\s*</p>'
        Replacement = @'
<p
                              className={
                                session.meeting_url
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }
                            >
                              {session.meeting_url ? "[OK]" : "[!]"} Meeting link
                            </p>
'@
    },
    @{
        Name = "Material readiness"
        Pattern = '(?s)<p\s+className=\{\s*session\.material_url.*?Materials\s*</p>'
        Replacement = @'
<p
                              className={
                                session.material_url
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }
                            >
                              {session.material_url ? "[OK]" : "[!]"} Materials
                            </p>
'@
    }
)

$changed = 0

foreach ($item in $replacements) {
    $regex = [regex]::new($item.Pattern)
    $matches = $regex.Matches($content).Count

    if ($matches -gt 0) {
        $content = $regex.Replace($content, $item.Replacement, 1)
        $changed++
        Write-Host "Fixed: $($item.Name)" -ForegroundColor Green
    }
    else {
        Write-Host "Pattern not found: $($item.Name)" -ForegroundColor Yellow
    }
}

# Clean up any remaining corrupted checkmark fragments in quoted JSX text.
$content = $content -replace '"鉁\?[^"]*"', '"[OK]"'

[System.IO.File]::WriteAllText($path, $content, $utf8)

Write-Host ""
Write-Host "Backup created: $backup" -ForegroundColor Cyan
Write-Host "Readiness blocks fixed: $changed / 4" -ForegroundColor Cyan
Write-Host ""

if ($changed -eq 0) {
    throw "No readiness blocks were found. Restore from backup if needed and inspect the file manually."
}

Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue

$packageJsonPath = Join-Path $root "package.json"
$packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
$scripts = $packageJson.scripts

Write-Host "Running TypeScript validation..." -ForegroundColor Yellow

if ($null -ne $scripts -and $scripts.PSObject.Properties.Name -contains "typecheck") {
    npm.cmd run typecheck
}
elseif (Test-Path (Join-Path $root "tsconfig.json")) {
    npx.cmd tsc --noEmit
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "TypeScript validation still failed." -ForegroundColor Red
    Write-Host "Original backup:" -ForegroundColor Yellow
    Write-Host "  $backup"
    exit 1
}

Write-Host ""
Write-Host "SUCCESS." -ForegroundColor Green
Write-Host "The corrupted checkmark symbols were replaced with ASCII [OK] / [!]." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next run:" -ForegroundColor Yellow
Write-Host "  npm.cmd run build"

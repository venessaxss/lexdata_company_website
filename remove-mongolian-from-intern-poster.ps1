$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$contentPath = Join-Path $root "content\internHiring.ts"

if (-not (Test-Path -LiteralPath $contentPath)) {
    throw "Cannot find content\internHiring.ts. Run this script from the project root."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "$contentPath.backup-$timestamp"

Copy-Item `
    -LiteralPath $contentPath `
    -Destination $backupPath `
    -Force

$utf8 = New-Object System.Text.UTF8Encoding($false)

$content = [System.IO.File]::ReadAllText(
    $contentPath,
    [System.Text.Encoding]::UTF8
)

$updated = $content.Replace(
    "Chinese or Mongolian is an advantage",
    "Chinese is an advantage"
)

if ($updated -eq $content) {
    throw "The target text was not found in content\internHiring.ts."
}

[System.IO.File]::WriteAllText(
    $contentPath,
    $updated,
    $utf8
)

Remove-Item `
    -LiteralPath (Join-Path $root ".next") `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Updated internship text:" -ForegroundColor Green
Write-Host "  Chinese is an advantage"
Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupPath"
Write-Host ""
Write-Host "Restart the site:" -ForegroundColor Yellow
Write-Host "  npm.cmd run dev"

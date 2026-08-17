$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$path = Join-Path $root "app\admin\documents\certificates\page.tsx"

if (-not (Test-Path -LiteralPath $path)) {
    throw "Cannot find: $path`nRun this script from the LexData project root."
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $root "_backups\fix-certificate-revoke-jsx-$timestamp\app\admin\documents\certificates\page.tsx"

New-Item -ItemType Directory `
    -Path (Split-Path -Parent $backup) `
    -Force |
    Out-Null

Copy-Item `
    -LiteralPath $path `
    -Destination $backup `
    -Force

$content = [System.IO.File]::ReadAllText(
    $path,
    [System.Text.Encoding]::UTF8
)

# Locate the revoked-certificate conditional.
$startPattern = '\{\s*document\.status\s*===\s*"revoked"\s*\?\s*\('

$startRegex = [System.Text.RegularExpressions.Regex]::new(
    $startPattern,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$startMatch = $startRegex.Match($content)

if (-not $startMatch.Success) {
    throw 'Could not locate: {document.status === "revoked" ? ('
}

$startIndex = $startMatch.Index
$afterStart = $startMatch.Index + $startMatch.Length

# If already wrapped, do nothing.
$nextChunkLength = [Math]::Min(
    120,
    $content.Length - $afterStart
)

$nextChunk = $content.Substring(
    $afterStart,
    $nextChunkLength
)

if ($nextChunk -match '^\s*<>') {
    Write-Host "[OK] Revoked certificate JSX is already wrapped." -ForegroundColor DarkGreen
}
else {
    # Insert opening fragment immediately after the conditional opening.
    $content = $content.Insert(
        $afterStart,
        "`r`n                  <>"
    )

    # Recalculate from the same logical area after insertion.
    $searchStart = $afterStart + 24

    # Find the unique Reissue form/button text inside this revoked branch.
    $reissueMarker = "Reissue with current format"
    $reissueIndex = $content.IndexOf(
        $reissueMarker,
        $searchStart
    )

    if ($reissueIndex -lt 0) {
        # Newer wording used by the certificate revision patch.
        $reissueMarker = "Reissue corrected certificate"
        $reissueIndex = $content.IndexOf(
            $reissueMarker,
            $searchStart
        )
    }

    if ($reissueIndex -lt 0) {
        throw "Could not locate the certificate reissue button inside the revoked branch."
    }

    # Find the conditional terminator AFTER the reissue UI.
    $terminatorPattern = '\)\s*:\s*null\s*\}'

    $terminatorRegex = [System.Text.RegularExpressions.Regex]::new(
        $terminatorPattern,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    $terminatorMatch = $terminatorRegex.Match(
        $content,
        $reissueIndex
    )

    if (-not $terminatorMatch.Success) {
        throw "Could not locate the end of the revoked certificate conditional."
    }

    # Insert closing fragment immediately before the final `) : null}`.
    $content = $content.Insert(
        $terminatorMatch.Index,
        "`r`n                  </>`r`n                "
    )

    Write-Host "[OK] Wrapped revoked certificate correction panels in a React fragment." -ForegroundColor Green
}

[System.IO.File]::WriteAllText(
    $path,
    $content,
    $utf8
)

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
    Write-Host "  $backup"
    exit 1
}

Write-Host ""
Write-Host "[OK] Certificate revoke/revision JSX now passes TypeScript." -ForegroundColor Green
Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backup"
Write-Host ""
Write-Host "Then run:" -ForegroundColor Yellow
Write-Host "  npm.cmd run build"
Write-Host "  npm.cmd run dev"

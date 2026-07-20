# Roll back the latest paper-style visual backup.
$root = Get-Location
$latest = Get-ChildItem -Directory -Filter "_backup_before_paper_style_*" | Sort-Object Name -Descending | Select-Object -First 1
if (!$latest) { throw "No _backup_before_paper_style_* folder found." }
Copy-Item (Join-Path $latest.FullName "*") $root -Recurse -Force
Write-Host "Restored from $($latest.FullName)"

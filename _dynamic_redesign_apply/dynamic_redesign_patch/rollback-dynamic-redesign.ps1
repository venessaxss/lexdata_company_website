$ErrorActionPreference = "Stop"

$Root = Get-Location
$Backups = Get-ChildItem -Directory -Filter "_dynamic_redesign_backup_*" | Sort-Object Name -Descending
if (!$Backups -or $Backups.Count -eq 0) {
  throw "No _dynamic_redesign_backup_* folder found."
}

$Latest = $Backups[0].FullName
Write-Host "Restoring from $Latest"

Get-ChildItem $Latest -Recurse -File | ForEach-Object {
  $Rel = $_.FullName.Substring($Latest.Length + 1)
  $Dest = Join-Path $Root $Rel
  New-Item -ItemType Directory -Force (Split-Path -Parent $Dest) | Out-Null
  Copy-Item $_.FullName $Dest -Force
  Write-Host "Restored $Rel"
}

Write-Host "Rollback complete."

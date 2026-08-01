$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$patchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$payload = Join-Path $patchRoot "payload"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $root "_backups\real-course-enrollments-$timestamp"
$utf8 = New-Object System.Text.UTF8Encoding($false)

$files = @(
  "app\manager\course-registrations\actions.ts",
  "app\manager\course-registrations\page.tsx",
  "app\manager\course-registrations\[courseId]\page.tsx"
)

foreach ($relative in $files) {
  $source = Join-Path $payload $relative
  $destination = Join-Path $root $relative

  if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing patch file: $source"
  }

  if (Test-Path -LiteralPath $destination) {
    $backupFile = Join-Path $backup $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $backupFile) -Force | Out-Null
    Copy-Item -LiteralPath $destination -Destination $backupFile -Force
  }

  New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination -Force
}

$adminCourses = Join-Path $root "app\admin\courses\page.tsx"
if (Test-Path -LiteralPath $adminCourses) {
  $relative = "app\admin\courses\page.tsx"
  $backupFile = Join-Path $backup $relative
  New-Item -ItemType Directory -Path (Split-Path -Parent $backupFile) -Force | Out-Null
  Copy-Item -LiteralPath $adminCourses -Destination $backupFile -Force

  $content = [System.IO.File]::ReadAllText($adminCourses, [System.Text.Encoding]::UTF8)
  $content = $content.Replace('.from("enrollments")', '.from("course_enrollments")')
  [System.IO.File]::WriteAllText($adminCourses, $content, $utf8)
}

$managerPage = Join-Path $root "app\manager\page.tsx"
if (Test-Path -LiteralPath $managerPage) {
  $relative = "app\manager\page.tsx"
  $backupFile = Join-Path $backup $relative
  New-Item -ItemType Directory -Path (Split-Path -Parent $backupFile) -Force | Out-Null
  Copy-Item -LiteralPath $managerPage -Destination $backupFile -Force

  $content = [System.IO.File]::ReadAllText($managerPage, [System.Text.Encoding]::UTF8)
  $content = $content.Replace('.from("enrollments")', '.from("course_enrollments")')

  $pattern = '(\.from\("course_enrollments"\)[\s\S]{0,160}?)\.eq\("registration_status",\s*"pending"\)'
  $content = [regex]::Replace(
    $content,
    $pattern,
    '$1.eq("enrollment_status", "pending")'
  )

  [System.IO.File]::WriteAllText($managerPage, $content, $utf8)
}

$staleMigration = Join-Path $root "supabase\migrations\20260728_course_registration_management.sql"
if (Test-Path -LiteralPath $staleMigration) {
  $archive = Join-Path $backup "unused-migration"
  New-Item -ItemType Directory -Path $archive -Force | Out-Null
  Copy-Item -LiteralPath $staleMigration -Destination (Join-Path $archive "20260728_course_registration_management.sql") -Force
  Remove-Item -LiteralPath $staleMigration -Force
}

Remove-Item -LiteralPath (Join-Path $root ".next") -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Linked all course-registration pages to public.course_enrollments." -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor Cyan
Write-Host ""
Write-Host "Running TypeScript validation..." -ForegroundColor Yellow

npm.cmd run typecheck
if ($LASTEXITCODE -ne 0) {
  Write-Host "TypeScript validation failed. Backup: $backup" -ForegroundColor Red
  exit 1
}

Write-Host "TypeScript validation passed." -ForegroundColor Green

npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed. Backup: $backup" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "REAL COURSE ENROLLMENT DATA LINK COMPLETE" -ForegroundColor Green
Write-Host "No Supabase migration is required." -ForegroundColor Yellow
Write-Host "Run: npm.cmd run dev" -ForegroundColor Cyan

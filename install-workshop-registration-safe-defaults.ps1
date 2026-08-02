$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
if (-not (Test-Path -LiteralPath (Join-Path $root "package.json"))) {
    throw "Run this script from the project root."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\workshop-safe-defaults-$timestamp"
$migrationPath = Join-Path $root "supabase\migrations\20260801_secure_workshop_registration_defaults.sql"
$utf8 = New-Object System.Text.UTF8Encoding($false)

New-Item -ItemType Directory -Path (Split-Path -Parent $migrationPath) -Force | Out-Null
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$migration = @'
begin;

alter table public.workshop_registrations
  alter column registration_status set default 'pending';

alter table public.workshop_registrations
  alter column payment_status set default 'pending';

alter table public.workshop_registrations
  alter column access_status set default 'pending';

update public.workshop_registrations
set
  registration_status = coalesce(registration_status, 'pending'),
  payment_status = coalesce(payment_status, 'pending'),
  access_status = coalesce(access_status, 'pending')
where registration_status is null
   or payment_status is null
   or access_status is null;

update public.workshop_registrations
set
  payment_status = 'pending',
  access_status = 'pending'
where registration_status = 'pending'
  and payment_status = 'waived'
  and access_status = 'granted';

create or replace function public.force_new_workshop_registration_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.registration_status := 'pending';
  new.payment_status := 'pending';
  new.access_status := 'pending';
  return new;
end;
$$;

drop trigger if exists workshop_registration_initial_state
on public.workshop_registrations;

create trigger workshop_registration_initial_state
before insert on public.workshop_registrations
for each row
execute function public.force_new_workshop_registration_pending();

notify pgrst, 'reload schema';

commit;
'@

[System.IO.File]::WriteAllText($migrationPath, $migration, $utf8)

$scanRoots = @("app", "components", "lib")
$patched = 0

foreach ($scanRoot in $scanRoots) {
    $directory = Join-Path $root $scanRoot
    if (-not (Test-Path -LiteralPath $directory)) { continue }

    $files = Get-ChildItem -LiteralPath $directory -Recurse -File |
        Where-Object { $_.Extension -in @(".ts", ".tsx", ".js", ".jsx") }

    foreach ($file in $files) {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

        if (
            -not $content.Contains("workshop_registrations") -or
            ($content -notmatch "\.insert\s*\(" -and $content -notmatch "\.upsert\s*\(")
        ) {
            continue
        }

        $next = $content
        $next = [regex]::Replace(
            $next,
            'registration_status\s*:\s*["''][^"'']+["'']',
            'registration_status: "pending"'
        )
        $next = [regex]::Replace(
            $next,
            'payment_status\s*:\s*["''][^"'']+["'']',
            'payment_status: "pending"'
        )
        $next = [regex]::Replace(
            $next,
            'access_status\s*:\s*["''][^"'']+["'']',
            'access_status: "pending"'
        )

        if ($next -ne $content) {
            $relative = $file.FullName.Substring($root.Length).TrimStart("\", "/")
            $backup = Join-Path $backupRoot $relative
            New-Item -ItemType Directory -Path (Split-Path -Parent $backup) -Force | Out-Null
            Copy-Item -LiteralPath $file.FullName -Destination $backup -Force
            [System.IO.File]::WriteAllText($file.FullName, $next, $utf8)
            Write-Host "Patched defaults: $relative" -ForegroundColor Green
            $patched++
        }
    }
}

Remove-Item -LiteralPath (Join-Path $root ".next") -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Patched source files: $patched" -ForegroundColor Cyan
Write-Host "Migration created:" -ForegroundColor Cyan
Write-Host "  $migrationPath"
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""

$package = Get-Content -LiteralPath (Join-Path $root "package.json") -Raw | ConvertFrom-Json

if ($package.scripts.PSObject.Properties.Name -contains "typecheck") {
    npm.cmd run typecheck
} else {
    npx.cmd tsc --noEmit
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript validation failed. Backup: $backupRoot" -ForegroundColor Red
    exit 1
}

if ($package.scripts.PSObject.Properties.Name -contains "build") {
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed. Backup: $backupRoot" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "SAFE WORKSHOP REGISTRATION DEFAULTS INSTALLED" -ForegroundColor Green
Write-Host ""
Write-Host "New registrations begin as:" -ForegroundColor Cyan
Write-Host "  registration_status = pending"
Write-Host "  payment_status      = pending"
Write-Host "  access_status       = pending"
Write-Host ""
Write-Host "Required: run this SQL file in Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host "  supabase\migrations\20260801_secure_workshop_registration_defaults.sql"
Write-Host ""
Write-Host "Then run: npm.cmd run dev" -ForegroundColor Yellow

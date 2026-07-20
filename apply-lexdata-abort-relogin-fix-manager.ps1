$ErrorActionPreference="Stop"
Set-StrictMode -Version Latest

$root=(Get-Location).Path
$utf8=New-Object System.Text.UTF8Encoding($false)
$stamp=Get-Date -Format "yyyyMMdd_HHmmss"
$backup=Join-Path (Split-Path $root -Parent) ("lexdata_auth_abort_backup_"+$stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null

function Backup-File([string]$rel){
  $src=Join-Path $root $rel
  if(Test-Path $src){
    $dst=Join-Path $backup $rel
    $dir=Split-Path $dst -Parent
    if($dir){New-Item -ItemType Directory -Path $dir -Force|Out-Null}
    Copy-Item $src $dst -Force
  }
}
function Write-Utf8([string]$path,[string]$content){
  $dir=Split-Path $path -Parent
  if($dir -and !(Test-Path $dir)){New-Item -ItemType Directory -Path $dir -Force|Out-Null}
  [System.IO.File]::WriteAllText($path,$content,$utf8)
}
if(!(Test-Path (Join-Path $root "package.json"))){throw "Run this from the LexData Next.js project root."}

Backup-File "lib\supabase\server.ts"
$serverTs=@'
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // proxy.ts refreshes session cookies during navigation
        }
      },
    },
  });
}
'@
Write-Utf8 (Join-Path $root "lib\supabase\server.ts") $serverTs

Backup-File "proxy.ts"
$proxyTs=@'
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request: { headers: request.headers },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  // Deliberately NO redirect to /login here.
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
'@
Write-Utf8 (Join-Path $root "proxy.ts") $proxyTs

$middleware=Join-Path $root "middleware.ts"
if(Test-Path $middleware){
  Backup-File "middleware.ts"
  Move-Item $middleware (Join-Path $root "middleware.disabled.txt") -Force
}

$actions=Join-Path $root "app\manager\actions\payment-actions.ts"
if(Test-Path $actions){
  Backup-File "app\manager\actions\payment-actions.ts"
  $c=[System.IO.File]::ReadAllText($actions)

  $oldProfile=@'
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();
'@
  $newProfile=@'
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();
'@
  if($c.Contains($oldProfile)){$c=$c.Replace($oldProfile,$newProfile)}

  $oldStatus=@'
  let status =
    field(formData, "status") || existingRegistration.status || "pending";
'@
  $newStatus=@'
  let status =
    field(formData, "registration_status") ||
    field(formData, "status") ||
    existingRegistration.registration_status ||
    "pending";
'@
  if($c.Contains($oldStatus)){$c=$c.Replace($oldStatus,$newStatus)}

  $c=[regex]::Replace($c,'(?m)^(\s*)status,\r?$','${1}registration_status: status,')
  Write-Utf8 $actions $c
}

$managerLayout=Join-Path $root "app\manager\layout.tsx"
if(Test-Path $managerLayout){
  Backup-File "app\manager\layout.tsx"
  $c=[System.IO.File]::ReadAllText($managerLayout)
  $before=$c
  $c=$c.Replace('role !== "manager"','(role !== "manager" && role !== "admin")')
  $c=$c.Replace("role !== 'manager'","(role !== 'manager' && role !== 'admin')")
  if($c -ne $before){Write-Utf8 $managerLayout $c}
}

Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Applied permanent session + manager registration fix." -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host ""
Write-Host "Next:"
Write-Host "  npm.cmd run build"
Write-Host "  git add -A"
Write-Host '  git commit -m "Fix persistent auth session and manager registration updates"'
Write-Host "  git push origin HEAD"

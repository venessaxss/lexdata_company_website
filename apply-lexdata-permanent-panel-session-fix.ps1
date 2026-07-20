$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$parent = Split-Path $root -Parent
$backupRoot = Join-Path $parent ("lexdata_session_prefetch_fix_" + $stamp)

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

function Backup-File([string]$RelativePath) {
    $src = Join-Path $root $RelativePath
    if (Test-Path $src) {
        $dst = Join-Path $backupRoot $RelativePath
        $dir = Split-Path $dst -Parent
        if ($dir) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        Copy-Item $src $dst -Force
    }
}

function Write-Utf8([string]$Path, [string]$Content) {
    $dir = Split-Path $Path -Parent
    if ($dir -and !(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

if (!(Test-Path (Join-Path $root "package.json"))) {
    throw "Run this script from the LexData Next.js project root."
}

Write-Host "LexData permanent panel session fix" -ForegroundColor Cyan
Write-Host "Project: $root"
Write-Host "Backup:  $backupRoot"
Write-Host ""

$backupFiles = @(
    "lib\auth.ts",
    "lib\supabase\server.ts",
    "app\login\actions.ts",
    "app\auth\callback\route.ts",
    "components\LexPaperNavbar.tsx",
    "components\AuthSessionReady.tsx",
    "app\auth\session-ready\page.tsx"
)

foreach ($item in $backupFiles) {
    Backup-File $item
}

# -------------------------------------------------------------------
# 1. Make the durable signed LexData session the FIRST auth source.
#
# This avoids a new Supabase auth network dependency every time a user
# enters a protected page or submits a protected Server Action.
# Role authorization is still loaded fresh from the profiles table.
# -------------------------------------------------------------------

$authPath = Join-Path $root "lib\auth.ts"
$authContent = [System.IO.File]::ReadAllText($authPath)

if ($authContent -notmatch 'from "@/lib/app-session"') {
    $authContent = $authContent.Replace(
        'import { createAdminClient } from "@/lib/supabase/admin";',
        'import { createAdminClient } from "@/lib/supabase/admin";' + "`r`n" +
        'import { getDurableAppSession } from "@/lib/app-session";'
    )
}

$oldIdentityPattern = '(?s)async function getVerifiedIdentity\(\) \{.*?\r?\n\}\r?\n\r?\nexport async function getCurrentUser'

$newIdentityFunction = @'
async function getVerifiedIdentity() {
  // Primary identity source after a successful login:
  // a server-signed HttpOnly LexData session cookie.
  // This avoids false logout redirects caused by transient SSR token reads
  // or route-prefetch requests racing immediately after sign-in.
  const durable = await getDurableAppSession();

  if (durable?.id) {
    return {
      id: durable.id,
      email: durable.email || null,
      user_metadata: {},
      app_metadata: {},
    };
  }

  // Fallback/backfill path for users who already have a valid Supabase
  // cookie but have not yet received the durable LexData session cookie.
  const supabase = await createClient();

  try {
    const { data: claimsData } = await supabase.auth.getClaims();
    const claims = claimsData?.claims as Record<string, any> | undefined;

    if (claims?.sub) {
      return {
        id: String(claims.sub),
        email: typeof claims.email === "string" ? claims.email : null,
        user_metadata:
          claims.user_metadata && typeof claims.user_metadata === "object"
            ? claims.user_metadata
            : {},
        app_metadata:
          claims.app_metadata && typeof claims.app_metadata === "object"
            ? claims.app_metadata
            : {},
      };
    }
  } catch {
    // Continue to getUser fallback.
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user || null;
  } catch {
    return null;
  }
}

export async function getCurrentUser
'@

if ([regex]::IsMatch($authContent, $oldIdentityPattern)) {
    $authContent = [regex]::Replace(
        $authContent,
        $oldIdentityPattern,
        $newIdentityFunction,
        1
    )
} else {
    throw "Could not locate getVerifiedIdentity() in lib/auth.ts."
}

Write-Utf8 $authPath $authContent
Write-Host "Updated central auth to prefer the durable signed session." -ForegroundColor Green

# -------------------------------------------------------------------
# 2. Harden the shared server Supabase client.
#
# Any older panel code that directly calls supabase.auth.getUser() or
# getClaims() now falls back locally to the signed durable session.
# No extra Admin Auth network request is required for that fallback.
# -------------------------------------------------------------------

$serverTs = @'
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getDurableAppSession,
  setDurableAppSession,
} from "@/lib/app-session";

function fallbackUserFromDurable(session: {
  id: string;
  email?: string | null;
}) {
  return {
    id: session.id,
    email: session.email || undefined,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date(0).toISOString(),
  };
}

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  const client = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies.
          // proxy.ts refreshes Supabase cookies at the request boundary.
        }
      },
    },
  });

  const originalGetUser = client.auth.getUser.bind(client.auth);

  (client.auth as any).getUser = async (jwt?: string) => {
    try {
      const result = await originalGetUser(jwt);

      if (result?.data?.user) {
        if (!jwt) {
          try {
            await setDurableAppSession({
              id: result.data.user.id,
              email: result.data.user.email,
            });
          } catch {
            // Cookie writes are not allowed in every Server Component.
          }
        }

        return result;
      }

      if (jwt) {
        return result;
      }
    } catch {
      if (jwt) {
        throw new Error("Unable to validate supplied JWT.");
      }
    }

    const durable = await getDurableAppSession();

    if (!durable?.id) {
      return {
        data: { user: null },
        error: null,
      };
    }

    return {
      data: {
        user: fallbackUserFromDurable(durable),
      },
      error: null,
    };
  };

  const originalGetClaims = client.auth.getClaims.bind(client.auth);

  (client.auth as any).getClaims = async (...args: any[]) => {
    try {
      const result = await originalGetClaims(...args);
      const claims = result?.data?.claims as Record<string, any> | undefined;

      if (claims?.sub) {
        try {
          await setDurableAppSession({
            id: String(claims.sub),
            email: typeof claims.email === "string" ? claims.email : null,
          });
        } catch {
          // Cookie writes are not allowed in every Server Component.
        }

        return result;
      }
    } catch {
      // Continue to the durable session fallback.
    }

    const durable = await getDurableAppSession();

    if (!durable?.id) {
      return {
        data: { claims: null },
        error: null,
      };
    }

    const now = Math.floor(Date.now() / 1000);

    return {
      data: {
        claims: {
          sub: durable.id,
          email: durable.email || null,
          role: "authenticated",
          aud: "authenticated",
          iat: durable.iat || now,
          exp: durable.exp || now + 3600,
          user_metadata: {},
          app_metadata: {},
        },
      },
      error: null,
    };
  };

  return client;
}
'@

Write-Utf8 (Join-Path $root "lib\supabase\server.ts") $serverTs
Write-Host "Hardened direct getUser/getClaims calls across legacy panel code." -ForegroundColor Green

# -------------------------------------------------------------------
# 3. Add a no-prefetch sign-in bridge.
#
# Supabase documents a race where Next.js route prefetching immediately
# after sign-in can request protected routes before auth cookies are fully
# available in the browser. This bridge contains no Links. It bootstraps
# the durable cookie first, then performs a full navigation.
# -------------------------------------------------------------------

$sessionReadyClient = @'
"use client";

import { useEffect, useState } from "react";

export default function AuthSessionReady({
  nextPath,
}: {
  nextPath: string;
}) {
  const [message, setMessage] = useState("Securing your session...");

  useEffect(() => {
    let active = true;

    async function continueLogin() {
      try {
        await fetch("/api/auth/bootstrap", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });

        if (!active) return;

        setMessage("Opening your dashboard...");
      } catch {
        if (!active) return;

        setMessage("Opening your dashboard...");
      }

      window.location.replace(nextPath);
    }

    void continueLogin();

    return () => {
      active = false;
    };
  }, [nextPath]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
          LexData
        </p>
        <h1 className="mt-4 text-3xl font-black">Login successful</h1>
        <p className="mt-4 text-slate-300">{message}</p>
      </div>
    </main>
  );
}
'@

Write-Utf8 (Join-Path $root "components\AuthSessionReady.tsx") $sessionReadyClient

$sessionReadyPage = @'
import AuthSessionReady from "@/components/AuthSessionReady";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeNext(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default async function SessionReadyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNext(params.next);

  return <AuthSessionReady nextPath={nextPath} />;
}
'@

Write-Utf8 (Join-Path $root "app\auth\session-ready\page.tsx") $sessionReadyPage
Write-Host "Added the no-prefetch post-login session bridge." -ForegroundColor Green

# -------------------------------------------------------------------
# 4. Redirect successful password login/signup through the bridge.
# -------------------------------------------------------------------

$loginPath = Join-Path $root "app\login\actions.ts"
$loginContent = [System.IO.File]::ReadAllText($loginPath)

$loginContent = $loginContent.Replace(
    '  redirect(next);',
    '  redirect(`/auth/session-ready?next=${encodeURIComponent(next)}`);'
)

Write-Utf8 $loginPath $loginContent
Write-Host "Password login/signup now waits for session bootstrap before panels open." -ForegroundColor Green

# -------------------------------------------------------------------
# 5. OAuth callback also goes through the same bridge.
# -------------------------------------------------------------------

$callbackPath = Join-Path $root "app\auth\callback\route.ts"
if (Test-Path $callbackPath) {
    $callbackContent = [System.IO.File]::ReadAllText($callbackPath)

    $callbackContent = $callbackContent.Replace(
        '      return NextResponse.redirect(`${origin}${next}`);',
        '      return NextResponse.redirect(`${origin}/auth/session-ready?next=${encodeURIComponent(next)}`);'
    )

    Write-Utf8 $callbackPath $callbackContent
    Write-Host "OAuth callback now uses the session bridge." -ForegroundColor Green
}

# -------------------------------------------------------------------
# 6. Disable Next.js Link prefetch throughout protected panels.
#
# This prevents unauthenticated/stale RSC redirect payloads from being
# prefetched and cached immediately after login.
# -------------------------------------------------------------------

$protectedRoots = @(
    "app\admin",
    "app\manager",
    "app\dashboard",
    "app\my",
    "app\speaker"
)

$patchedLinkFiles = 0

foreach ($relativeRoot in $protectedRoots) {
    $absoluteRoot = Join-Path $root $relativeRoot

    if (!(Test-Path $absoluteRoot)) {
        continue
    }

    Get-ChildItem $absoluteRoot -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -eq ".tsx" } |
        ForEach-Object {
            $path = $_.FullName
            $relative = $path.Substring($root.Length).TrimStart("\")
            $before = [System.IO.File]::ReadAllText($path)

            $after = [regex]::Replace(
                $before,
                '<Link(?![^>]*\bprefetch\s*=)',
                '<Link prefetch={false}'
            )

            if ($after -ne $before) {
                Backup-File $relative
                Write-Utf8 $path $after
                $patchedLinkFiles++
            }
        }
}

# Disable prefetch in the global signed-in navbar too.
$navbarPath = Join-Path $root "components\LexPaperNavbar.tsx"

if (Test-Path $navbarPath) {
    $navbarContent = [System.IO.File]::ReadAllText($navbarPath)

    $navbarUpdated = [regex]::Replace(
        $navbarContent,
        '<Link(?![^>]*\bprefetch\s*=)',
        '<Link prefetch={false}'
    )

    if ($navbarUpdated -ne $navbarContent) {
        Write-Utf8 $navbarPath $navbarUpdated
    }
}

Write-Host "Disabled protected-route Link prefetch in $patchedLinkFiles panel files." -ForegroundColor Green

# -------------------------------------------------------------------
# 7. Audit and clear cache.
# -------------------------------------------------------------------

Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Permanent panel session patch applied." -ForegroundColor Green
Write-Host ""
Write-Host "The fix targets both causes:" -ForegroundColor Cyan
Write-Host "  1. Protected routes/actions now prefer the signed durable LexData session."
Write-Host "  2. Protected panel Links no longer prefetch stale login redirects."
Write-Host "  3. Successful login goes through a no-prefetch session-ready bridge."
Write-Host ""
Write-Host "Run now:" -ForegroundColor Cyan
Write-Host "  npm.cmd run build"
Write-Host ""
Write-Host "After a successful build:" -ForegroundColor Cyan
Write-Host "  git add -A"
Write-Host '  git commit -m "Fix repeated relogin across all protected panels"'
Write-Host "  git push origin HEAD"
Write-Host ""
Write-Host "After deployment, log out once and log in once." -ForegroundColor Yellow
Write-Host "Then test Admin -> Courses -> Admin, Admin -> Registrations, Manager -> Registrations, and Save status changes."

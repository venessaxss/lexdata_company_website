$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$parent = Split-Path $root -Parent
$backupRoot = Join-Path $parent ("lexdata_no_relogin_backup_" + $stamp)

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

Write-Host "LexData NO-RELOGIN patch" -ForegroundColor Cyan
Write-Host "Project: $root"
Write-Host "Backup:  $backupRoot"
Write-Host ""

$backupFiles = @(
    "lib\app-session.ts",
    "lib\supabase\server.ts",
    "lib\auth.ts",
    "app\login\actions.ts",
    "app\auth\callback\route.ts",
    "app\logout\route.ts",
    "app\logout\actions.ts",
    "components\AuthSync.tsx",
    "app\api\auth\bootstrap\route.ts"
)

foreach ($file in $backupFiles) {
    Backup-File $file
}

# ============================================================
# 1. Durable signed app-session cookie
#
# This is a server-signed fallback identity cookie.
# It does NOT contain passwords or Supabase refresh tokens.
# It is verified with HMAC and checked against Supabase Auth Admin
# before it can be used as a fallback identity.
# ============================================================

$appSessionTs = @'
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "lexdata_app_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type DurableIdentity = {
  id: string;
  email?: string | null;
  iat: number;
  exp: number;
};

function sessionSecret() {
  const secret =
    process.env.LEXDATA_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "Missing LEXDATA_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return secret;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string) {
  return createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
}

function validSignature(payload: string, received: string) {
  const expected = signature(payload);
  const left = Buffer.from(expected);
  const right = Buffer.from(received);

  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

export async function setDurableAppSession(input: {
  id: string;
  email?: string | null;
}) {
  const now = Math.floor(Date.now() / 1000);

  const identity: DurableIdentity = {
    id: input.id,
    email: input.email || null,
    iat: now,
    exp: now + MAX_AGE_SECONDS,
  };

  const payload = encode(JSON.stringify(identity));
  const token = `${payload}.${signature(payload)}`;

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getDurableAppSession(): Promise<DurableIdentity | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const separator = token.lastIndexOf(".");
    if (separator <= 0) return null;

    const payload = token.slice(0, separator);
    const receivedSignature = token.slice(separator + 1);

    if (!validSignature(payload, receivedSignature)) {
      return null;
    }

    const identity = JSON.parse(decode(payload)) as DurableIdentity;

    if (!identity?.id || !identity?.exp) {
      return null;
    }

    if (identity.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return identity;
  } catch {
    return null;
  }
}

export async function clearDurableAppSession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}
'@

Write-Utf8 (Join-Path $root "lib\app-session.ts") $appSessionTs

# ============================================================
# 2. Harden the shared server Supabase client.
#
# Every existing panel that calls auth.getUser() or auth.getClaims()
# now gets a verified durable fallback if the SSR auth call briefly
# loses the Supabase cookie during a Server Action/navigation.
# ============================================================

$serverTs = @'
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getDurableAppSession,
  setDurableAppSession,
} from "@/lib/app-session";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifiedFallbackUser() {
  const fallback = await getDurableAppSession();
  if (!fallback?.id) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(fallback.id);

    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
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
          // proxy.ts writes refreshed Supabase cookies at the request boundary.
        }
      },
    },
  });

  const originalGetUser = client.auth.getUser.bind(client.auth);

  (client.auth as any).getUser = async (jwt?: string) => {
    const result = await originalGetUser(jwt);

    if (result?.data?.user) {
      if (!jwt) {
        try {
          await setDurableAppSession({
            id: result.data.user.id,
            email: result.data.user.email,
          });
        } catch {
          // Cookie writes are not allowed from every Server Component.
        }
      }

      return result;
    }

    if (jwt) {
      return result;
    }

    const fallbackUser = await verifiedFallbackUser();

    if (!fallbackUser) {
      return result;
    }

    return {
      data: { user: fallbackUser },
      error: null,
    };
  };

  const originalGetClaims = client.auth.getClaims.bind(client.auth);

  (client.auth as any).getClaims = async (...args: any[]) => {
    const result = await originalGetClaims(...args);
    const claims = result?.data?.claims as Record<string, any> | undefined;

    if (claims?.sub) {
      try {
        await setDurableAppSession({
          id: String(claims.sub),
          email: typeof claims.email === "string" ? claims.email : null,
        });
      } catch {
        // Cookie writes are not allowed from every Server Component.
      }

      return result;
    }

    const fallbackUser = await verifiedFallbackUser();

    if (!fallbackUser) {
      return result;
    }

    const fallback = await getDurableAppSession();
    const now = Math.floor(Date.now() / 1000);

    return {
      data: {
        claims: {
          sub: fallbackUser.id,
          email: fallbackUser.email,
          role: "authenticated",
          aud: "authenticated",
          iat: fallback?.iat || now,
          exp: fallback?.exp || now + 3600,
          user_metadata: fallbackUser.user_metadata || {},
          app_metadata: fallbackUser.app_metadata || {},
        },
      },
      error: null,
    };
  };

  return client;
}
'@

Write-Utf8 (Join-Path $root "lib\supabase\server.ts") $serverTs

# ============================================================
# 3. Central auth.
#    Keep real role authorization, but use the shared hardened client.
# ============================================================

$authTs = @'
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppRole =
  | "admin"
  | "manager"
  | "speaker"
  | "staff"
  | "member"
  | "user"
  | string;

export type AuthContext = {
  id: string;
  email?: string | null;
  role: AppRole;
  full_name?: string | null;
  name?: string | null;
  display_name?: string | null;
  user: any;
  profile: any;
  admin: ReturnType<typeof createAdminClient>;
};

export function normalizeRole(role?: string | null) {
  return String(role || "member").trim().toLowerCase();
}

function getAdminEmails() {
  return String(process.env.LEXDATA_ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function applyAdminOverride(email?: string | null, role?: string | null) {
  const normalized = normalizeRole(role);

  if (email && getAdminEmails().includes(email.toLowerCase())) {
    return "admin";
  }

  return normalized;
}

function makeContext(
  user: any,
  profile: any,
  admin: ReturnType<typeof createAdminClient>
): AuthContext {
  const role = applyAdminOverride(user?.email, profile?.role);

  const context = {
    ...(profile || {}),
    id: user.id,
    email: user.email,
    role,
    user,
    admin,
    profile: null,
  } as AuthContext;

  context.profile = context;
  return context;
}

async function getVerifiedIdentity() {
  const supabase = await createClient();

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user || null;
}

export async function getCurrentUser() {
  return getVerifiedIdentity();
}

export async function requireUser(next = "/dashboard") {
  const user = await getVerifiedIdentity();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return user;
}

export async function getCurrentProfile() {
  const user = await getVerifiedIdentity();
  if (!user) return null;

  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile lookup failed:", error.message);
  }

  return makeContext(user, profile, admin);
}

export async function requireProfile(next = "/dashboard") {
  const user = await requireUser(next);
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile lookup failed:", error.message);
  }

  return makeContext(user, profile, admin);
}

export async function requireRole(allowedRoles: string[], next = "/dashboard") {
  const context = await requireProfile(next);
  const role = normalizeRole(context.role);
  const allowed = allowedRoles.map((item) => normalizeRole(item));

  if (role === "admin") return context;
  if (role === "manager" && allowed.includes("manager")) return context;

  if (!allowed.includes(role)) {
    redirect("/unauthorized");
  }

  return context;
}

export async function requireAdmin(next = "/admin") {
  return requireRole(["admin"], next);
}

export async function requireManager(next = "/manager") {
  return requireRole(["admin", "manager"], next);
}

export async function requireAdminOrManager(next = "/admin") {
  return requireRole(["admin", "manager"], next);
}

export async function requireManagerOrAdmin(next = "/manager") {
  return requireRole(["admin", "manager"], next);
}

export async function requireSpeaker(next = "/speaker") {
  return requireRole(["admin", "speaker"], next);
}

export async function requireSpeakerOrAdmin(next = "/speaker") {
  return requireRole(["admin", "speaker"], next);
}

export async function requireStaffOrAdmin(next = "/admin") {
  return requireRole(["admin", "manager", "staff"], next);
}

export async function getUserRole() {
  const profile = await getCurrentProfile();
  return normalizeRole(profile?.role);
}

export async function isAdmin() {
  const role = await getUserRole();
  return role === "admin";
}

export async function isManagerOrAdmin() {
  const role = await getUserRole();
  return role === "admin" || role === "manager";
}
'@

Write-Utf8 (Join-Path $root "lib\auth.ts") $authTs

# ============================================================
# 4. Login creates BOTH:
#    - normal Supabase SSR session
#    - durable signed fallback cookie
# ============================================================

$loginActionsTs = @'
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setDurableAppSession } from "@/lib/app-session";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function safeNextPath(value: string) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

export async function loginAction(formData: FormData) {
  const email = readText(formData, "email");
  const password = readText(formData, "password");
  const next = safeNextPath(
    readText(formData, "next") || readText(formData, "redirect")
  );

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Please enter your email and password."
      )}&next=${encodeURIComponent(next)}`
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect(
      `/login?error=${encodeURIComponent(
        error?.message || "Login failed."
      )}&next=${encodeURIComponent(next)}`
    );
  }

  await setDurableAppSession({
    id: data.user.id,
    email: data.user.email,
  });

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signupAction(formData: FormData) {
  const email = readText(formData, "email");
  const password = readText(formData, "password");
  const next = safeNextPath(readText(formData, "next") || "/dashboard");

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Please enter your email and password."
      )}&next=${encodeURIComponent(next)}`
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(
        next
      )}`
    );
  }

  if (data.session && data.user) {
    await setDurableAppSession({
      id: data.user.id,
      email: data.user.email,
    });

    revalidatePath("/", "layout");
    redirect(next);
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Account created. Confirm your email if confirmation is enabled, then log in."
    )}&next=${encodeURIComponent(next)}`
  );
}
'@

Write-Utf8 (Join-Path $root "app\login\actions.ts") $loginActionsTs

# ============================================================
# 5. OAuth/auth callback also creates durable session.
# ============================================================

$callbackTs = @'
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setDurableAppSession } from "@/lib/app-session";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await setDurableAppSession({
          id: user.id,
          email: user.email,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Could not authenticate.")}`
  );
}
'@

Write-Utf8 (Join-Path $root "app\auth\callback\route.ts") $callbackTs

# ============================================================
# 6. Bootstrap endpoint.
#
# Existing logged-in users get the durable fallback automatically.
# No manual relogin is required if the current Supabase session is valid.
# ============================================================

$bootstrapTs = @'
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  clearDurableAppSession,
  setDurableAppSession,
} from "@/lib/app-session";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await setDurableAppSession({
    id: user.id,
    email: user.email,
  });

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}

export async function DELETE() {
  await clearDurableAppSession();

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
'@

Write-Utf8 (Join-Path $root "app\api\auth\bootstrap\route.ts") $bootstrapTs

# ============================================================
# 7. AuthSync:
#    - bootstrap durable session on mount
#    - refresh durable fallback on Supabase token rotation
#    - NO router.refresh on SIGNED_IN/TOKEN_REFRESHED
# ============================================================

$authSyncTs = @'
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

async function bootstrapDurableSession() {
  try {
    await fetch("/api/auth/bootstrap", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // Navigation must not fail because the bootstrap helper is unavailable.
  }
}

export default function AuthSync() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    void bootstrapDurableSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        void bootstrapDurableSession();
        return;
      }

      if (event === "SIGNED_OUT") {
        void fetch("/api/auth/bootstrap", {
          method: "DELETE",
          credentials: "include",
          cache: "no-store",
        }).finally(() => {
          if (mounted) {
            router.refresh();
          }
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
'@

Write-Utf8 (Join-Path $root "components\AuthSync.tsx") $authSyncTs

# ============================================================
# 8. Logout clears BOTH session systems.
# ============================================================

$logoutRouteTs = @'
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clearDurableAppSession } from "@/lib/app-session";

export async function GET() {
  const supabase = await createClient();

  try {
    await supabase.auth.signOut();
  } finally {
    await clearDurableAppSession();
  }

  redirect("/login");
}
'@

Write-Utf8 (Join-Path $root "app\logout\route.ts") $logoutRouteTs

$logoutActionsTs = @'
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clearDurableAppSession } from "@/lib/app-session";

export async function logoutAction() {
  const supabase = await createClient();

  try {
    await supabase.auth.signOut();
  } finally {
    await clearDurableAppSession();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
'@

Write-Utf8 (Join-Path $root "app\logout\actions.ts") $logoutActionsTs

# ============================================================
# 9. Remove redundant direct LOGIN redirects inside protected panels.
#
# The panel layouts are the auth boundary. Child pages/actions must not
# independently throw users back to /login during normal panel actions.
# If a child still sees no identity, it goes to /unauthorized instead.
# ============================================================

$panelRoots = @(
    "app\dashboard",
    "app\manager",
    "app\admin",
    "app\my",
    "app\speaker"
)

$reloginChanges = 0

foreach ($panelRoot in $panelRoots) {
    $absoluteRoot = Join-Path $root $panelRoot

    if (!(Test-Path $absoluteRoot)) {
        continue
    }

    Get-ChildItem $absoluteRoot -Recurse -File |
        Where-Object { $_.Extension -in ".ts", ".tsx" } |
        ForEach-Object {
            $path = $_.FullName
            $relative = $path.Substring($root.Length).TrimStart("\")
            $before = [System.IO.File]::ReadAllText($path)
            $after = $before

            # Quoted redirects, e.g. redirect("/login?next=...")
            $after = [regex]::Replace(
                $after,
                'redirect\(\s*["'']/login[^"'']*["'']\s*\)',
                'redirect("/unauthorized")'
            )

            # Template-literal redirects, e.g. redirect(`/login?next=${...}`)
            $after = [regex]::Replace(
                $after,
                'redirect\(\s*`/login[^`]*`\s*\)',
                'redirect("/unauthorized")'
            )

            if ($after -ne $before) {
                Backup-File $relative
                Write-Utf8 $path $after
                $reloginChanges++
                Write-Host "Removed redundant panel relogin redirect: $relative" -ForegroundColor Yellow
            }
        }
}

# ============================================================
# 10. Clear cache and audit.
# ============================================================

Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "NO-RELOGIN patch applied." -ForegroundColor Green
Write-Host "Direct panel files cleaned: $reloginChanges"
Write-Host ""

Write-Host "Remaining /login redirect audit inside protected panels:" -ForegroundColor Cyan

$remaining = @()

foreach ($panelRoot in $panelRoots) {
    $absoluteRoot = Join-Path $root $panelRoot

    if (Test-Path $absoluteRoot) {
        $matches = Get-ChildItem $absoluteRoot -Recurse -File |
            Where-Object { $_.Extension -in ".ts", ".tsx" } |
            Select-String -Pattern 'redirect\(.*/login' -ErrorAction SilentlyContinue

        if ($matches) {
            $remaining += $matches
        }
    }
}

if ($remaining.Count -eq 0) {
    Write-Host "  None. Protected panels no longer contain direct forced-login redirects." -ForegroundColor Green
} else {
    $remaining | ForEach-Object {
        Write-Host ("  WARNING: " + $_.Path + ":" + $_.LineNumber) -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Run:" -ForegroundColor Cyan
Write-Host "  npm.cmd run build"
Write-Host ""
Write-Host "Then push:" -ForegroundColor Cyan
Write-Host "  git add -A"
Write-Host '  git commit -m "Eliminate repeated panel relogin and persist authenticated actions"'
Write-Host "  git push origin HEAD"
Write-Host ""
Write-Host "After Vercel deploys, reload the site." -ForegroundColor Cyan
Write-Host "If your current Supabase session is still valid, AuthSync will bootstrap the durable session automatically."
Write-Host "Otherwise, log in one final time. After that, panel navigation and Save/Confirm/Waive actions use the durable signed fallback instead of forcing repeated login."

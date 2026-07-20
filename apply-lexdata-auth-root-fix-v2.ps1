$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$parent = Split-Path $root -Parent
$backupRoot = Join-Path $parent ("lexdata_auth_root_fix_" + $stamp)

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

Write-Host "LexData auth root fix" -ForegroundColor Cyan
Write-Host "Project: $root"
Write-Host "Backup:  $backupRoot"
Write-Host ""

$filesToBackup = @(
    "proxy.ts",
    "lib\supabase\client.ts",
    "lib\supabase\server.ts",
    "lib\auth.ts",
    "components\AuthSync.tsx",
    "app\manager\actions\payment-actions.ts",
    "app\manager\registrations\page.tsx",
    "app\dashboard\page.tsx"
)

foreach ($item in $filesToBackup) {
    Backup-File $item
}

# -------------------------------------------------------------------
# 1. Browser Supabase client
#    Use the same public key choice as server/proxy.
# -------------------------------------------------------------------

$clientTs = @'
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
'@

Write-Utf8 (Join-Path $root "lib\supabase\client.ts") $clientTs

# -------------------------------------------------------------------
# 2. Server Supabase client
#    Cookie-based SSR client. Same project URL/key as browser and proxy.
# -------------------------------------------------------------------

$serverTs = @'
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createServerClient(supabaseUrl, supabaseKey, {
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
          // proxy.ts refreshes and writes the session cookies.
        }
      },
    },
  });
}
'@

Write-Utf8 (Join-Path $root "lib\supabase\server.ts") $serverTs

# -------------------------------------------------------------------
# 3. Proxy
#
# IMPORTANT:
# - uses the exact request object when recreating NextResponse
# - copies cookies to request and response
# - preserves headers returned by @supabase/ssr
# - uses getClaims for validated session refresh/protection
# - never redirects to /login
# -------------------------------------------------------------------

$proxyTs = @'
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers || {}).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  // Validate/refresh the JWT once at the request boundary.
  // There is deliberately NO login redirect in Proxy.
  await supabase.auth.getClaims();

  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/my") ||
    pathname.startsWith("/speaker")
  ) {
    supabaseResponse.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate"
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
'@

Write-Utf8 (Join-Path $root "proxy.ts") $proxyTs

# Disable obsolete middleware if it exists.
$middleware = Join-Path $root "middleware.ts"
if (Test-Path $middleware) {
    Backup-File "middleware.ts"
    Move-Item $middleware (Join-Path $root "middleware.disabled.txt") -Force
}

# -------------------------------------------------------------------
# 4. Central auth
#
# The previous code used auth.getUser() on every protected page.
# That makes every navigation depend on an extra Auth network request.
# Use validated JWT claims for route protection instead.
# -------------------------------------------------------------------

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

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, any> | undefined;

  if (error || !claims?.sub) {
    return null;
  }

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

# -------------------------------------------------------------------
# 5. AuthSync
#
# Do not router.refresh() on TOKEN_REFRESHED.
# Proxy already handles refreshed cookies. Refreshing the whole React tree on
# every token rotation creates unnecessary duplicate protected-route requests.
# -------------------------------------------------------------------

$authSyncTs = @'
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthSync() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "INITIAL_SESSION") return;

      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        router.refresh();
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

# -------------------------------------------------------------------
# 6. Manager registration action
#
# Fixes:
# - requires manager/admin
# - reports database errors instead of silently doing nothing
# - does not assume an updated_at column exists
# - preserves the selected registration status when sending/recording payment
# - redirects back with visible success/error feedback
# -------------------------------------------------------------------

$paymentActionsTs = @'
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/auth";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function safeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/manager/registrations";
  }
  return value;
}

function withMessage(path: string, key: "message" | "error", message: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(message)}`;
}

async function notifyUser(input: {
  admin: any;
  userId?: string | null;
  email?: string | null;
  title: string;
  body: string;
  sourceType: string;
  sourceId: string;
}) {
  const { error } = await input.admin.from("internal_messages").insert({
    user_id: input.userId || null,
    recipient_email: input.email || null,
    title: input.title,
    body: input.body,
    source_type: input.sourceType,
    source_id: input.sourceId,
  });

  if (error) {
    console.error("Internal notification failed:", error.message);
  }

  if (!input.email || !process.env.RESEND_API_KEY) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "LexData <noreply@lexdataai.com>",
        to: input.email,
        subject: input.title,
        text: input.body,
      }),
    });
  } catch (error) {
    console.error("Email notification failed:", error);
  }
}

async function revalidateRegistrationPages(
  admin: any,
  workshopId?: string | null
) {
  if (workshopId) {
    const { data: workshop } = await admin
      .from("workshops")
      .select("slug")
      .eq("id", workshopId)
      .maybeSingle();

    if (workshop?.slug) {
      revalidatePath(`/workshops/${workshop.slug}`);
    }
  }

  revalidatePath("/manager");
  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/manager/monitor");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/my-learning");
  revalidatePath("/my/workshops");
}

export async function handleRegistrationManagementAction(formData: FormData) {
  const returnTo = safeReturnTo(
    text(formData, "return_to") || "/manager/registrations"
  );

  const actor = await requireManagerOrAdmin("/manager/registrations");
  const admin = actor.admin;

  const intent = text(formData, "intent");
  const registrationId = text(formData, "registration_id");

  if (!registrationId) {
    redirect(withMessage(returnTo, "error", "Missing registration ID."));
  }

  const { data: registration, error: loadError } = await admin
    .from("workshop_registrations")
    .select(
      "id, user_id, email, full_name, workshop_id, registration_status, payment_status"
    )
    .eq("id", registrationId)
    .maybeSingle();

  if (loadError || !registration) {
    redirect(
      withMessage(
        returnTo,
        "error",
        loadError?.message || "Registration not found."
      )
    );
  }

  const registrationStatus =
    text(formData, "registration_status") ||
    registration.registration_status ||
    "pending";

  const paymentStatus =
    text(formData, "payment_status") ||
    registration.payment_status ||
    "pending";

  const paymentLink = text(formData, "payment_link");
  const paymentNote = text(formData, "payment_note");
  const paymentCurrency = text(formData, "payment_currency") || "USD";
  const parsedAmount = Number(text(formData, "amount_received") || 0);
  const amountReceived = Number.isFinite(parsedAmount) ? parsedAmount : 0;

  let updatePayload: Record<string, unknown>;
  let successMessage = "Registration updated.";
  let notification:
    | {
        title: string;
        body: string;
        sourceType: string;
      }
    | undefined;

  switch (intent) {
    case "save_statuses":
      updatePayload = {
        registration_status: registrationStatus,
        payment_status: paymentStatus,
      };
      successMessage = "Registration and payment statuses saved.";
      break;

    case "send_payment_message":
      updatePayload = {
        registration_status: registrationStatus,
        payment_status: "instructions_sent",
        payment_link: paymentLink || null,
        payment_note: paymentNote || null,
      };
      successMessage = "Payment instructions saved and sent.";
      notification = {
        title: "Payment instructions sent",
        body:
          paymentNote ||
          (paymentLink
            ? `Payment instructions have been sent. Please complete payment using this link: ${paymentLink}`
            : "Payment instructions have been sent. Please complete payment and upload your receipt."),
        sourceType: "payment_instructions",
      };
      break;

    case "record_payment_received":
      updatePayload = {
        registration_status: registrationStatus,
        payment_status: "under_review",
        amount_received: amountReceived,
        payment_currency: paymentCurrency,
        payment_note: paymentNote || null,
      };
      successMessage = "Payment information recorded.";
      notification = {
        title: "Payment information received",
        body: "Your payment information has been recorded and is now under review.",
        sourceType: "payment_received",
      };
      break;

    case "confirm_payment":
      updatePayload = {
        registration_status: "confirmed",
        payment_status: "confirmed",
        amount_received: amountReceived,
        payment_currency: paymentCurrency,
        payment_note: paymentNote || null,
      };
      successMessage = "Payment confirmed and workshop access unlocked.";
      notification = {
        title: "Payment confirmed",
        body: "Your payment has been confirmed. Your workshop access is now unlocked.",
        sourceType: "payment_confirmed",
      };
      break;

    case "waive_payment":
      updatePayload = {
        registration_status: "confirmed",
        payment_status: "waived",
        amount_received: 0,
        payment_note: paymentNote || null,
      };
      successMessage = "Payment waived and workshop access unlocked.";
      notification = {
        title: "Workshop access unlocked",
        body: "Your payment has been waived. Your workshop access is now unlocked.",
        sourceType: "payment_waived",
      };
      break;

    default:
      redirect(withMessage(returnTo, "error", "Unknown registration action."));
  }

  const { error: updateError } = await admin
    .from("workshop_registrations")
    .update(updatePayload)
    .eq("id", registrationId);

  if (updateError) {
    redirect(withMessage(returnTo, "error", updateError.message));
  }

  if (notification) {
    await notifyUser({
      admin,
      userId: registration.user_id,
      email: registration.email,
      title: notification.title,
      body: notification.body,
      sourceType: notification.sourceType,
      sourceId: registrationId,
    });
  }

  await revalidateRegistrationPages(admin, registration.workshop_id);

  redirect(withMessage(returnTo, "message", successMessage));
}

export const sendPaymentInstructionsAction =
  handleRegistrationManagementAction;
export const updateWorkshopRegistrationPaymentAction =
  handleRegistrationManagementAction;
export const updatePaymentAction = handleRegistrationManagementAction;
export const updateWorkshopRegistration =
  handleRegistrationManagementAction;
'@

Write-Utf8 (Join-Path $root "app\manager\actions\payment-actions.ts") $paymentActionsTs

# -------------------------------------------------------------------
# 7. Patch manager registration page:
#    - accept message/error
#    - show action feedback
#    - send return_to to the server action
# -------------------------------------------------------------------

$registrationsPath = Join-Path $root "app\manager\registrations\page.tsx"
if (Test-Path $registrationsPath) {
    $c = [System.IO.File]::ReadAllText($registrationsPath)

    $c = $c.Replace(
        '  pageSize?: string;' + "`r`n" + '};',
        '  pageSize?: string;' + "`r`n" +
        '  message?: string;' + "`r`n" +
        '  error?: string;' + "`r`n" +
        '};'
    )

    $needle = @'
          </div>

          <Link
            href="/manager"
'@

    $replacement = @'
          </div>

          <Link
            href="/manager"
'@

    # Add feedback after the top heading/link block, before filter form.
    $anchor = @'
        {workshopsError ? (
'@

    if ($c.Contains($anchor) -and -not $c.Contains("resolvedSearchParams.message ?")) {
        $feedback = @'
        {resolvedSearchParams.message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            {resolvedSearchParams.message}
          </div>
        ) : null}

        {resolvedSearchParams.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {resolvedSearchParams.error}
          </div>
        ) : null}

'@
        $c = $c.Replace($anchor, $feedback + $anchor)
    }

    # Add return_to hidden field to each management action form.
    $formAnchor = @'
                              className="space-y-4"
                            >
'@

    if ($c.Contains($formAnchor) -and -not $c.Contains('name="return_to"')) {
        $formReplacement = @'
                              className="space-y-4"
                            >
                              <input
                                type="hidden"
                                name="return_to"
                                value="/manager/registrations"
                              />
'@
        $c = $c.Replace($formAnchor, $formReplacement)
    }

    Write-Utf8 $registrationsPath $c
}

# -------------------------------------------------------------------
# 8. Patch dashboard page so it does not make another auth.getUser()
#    network request after DashboardLayout has already authenticated.
# -------------------------------------------------------------------

$dashboardPath = Join-Path $root "app\dashboard\page.tsx"
if (Test-Path $dashboardPath) {
    $c = [System.IO.File]::ReadAllText($dashboardPath)

    $c = $c.Replace('import { redirect } from "next/navigation";' + "`r`n", "")
    $c = $c.Replace('import { createClient } from "@/lib/supabase/server";' + "`r`n", "")
    $c = $c.Replace(
        'import { normalizeRole } from "@/lib/roles";',
        'import { normalizeRole } from "@/lib/roles";' + "`r`n" +
        'import { requireProfile } from "@/lib/auth";'
    )

    $oldBlock = @'
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/unauthorized");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as Profile | null;
'@

    $newBlock = @'
  const auth = await requireProfile("/dashboard");
  const user = auth.user;

  const profile = {
    full_name: auth.full_name,
    role: auth.role,
  } as Profile;
'@

    if ($c.Contains($oldBlock)) {
        $c = $c.Replace($oldBlock, $newBlock)
    }

    Write-Utf8 $dashboardPath $c
}

# -------------------------------------------------------------------
# 9. Clear Next cache and audit direct manager login redirects.
# -------------------------------------------------------------------

Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Auth root fix applied." -ForegroundColor Green
Write-Host ""
Write-Host "Manager subtree direct login redirect audit:" -ForegroundColor Cyan

$managerLoginRedirects = Get-ChildItem (Join-Path $root "app\manager") -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension -in ".ts", ".tsx" } |
    Select-String -Pattern '/login\?next=' -SimpleMatch

if ($managerLoginRedirects) {
    $managerLoginRedirects | ForEach-Object {
        Write-Host ("  WARNING: " + $_.Path + ":" + $_.LineNumber) -ForegroundColor Yellow
    }
} else {
    Write-Host "  None found." -ForegroundColor Green
}

Write-Host ""
Write-Host "Run now:" -ForegroundColor Cyan
Write-Host "  npm.cmd run build"
Write-Host ""
Write-Host "After a successful build, commit ONLY the actual source files:" -ForegroundColor Cyan
Write-Host "  git add proxy.ts lib/supabase/client.ts lib/supabase/server.ts lib/auth.ts components/AuthSync.tsx app/manager/actions/payment-actions.ts app/manager/registrations/page.tsx app/dashboard/page.tsx"
Write-Host '  git commit -m "Fix Supabase SSR session persistence and manager registration actions"'
Write-Host "  git push origin HEAD"
Write-Host ""
Write-Host "After Vercel deploys the commit:" -ForegroundColor Cyan
Write-Host "  1. Clear cookies for lexdataai.com once."
Write-Host "  2. Log in once."
Write-Host "  3. Open /dashboard -> /manager -> /manager/registrations."
Write-Host "  4. Change a registration status and verify the green success message."

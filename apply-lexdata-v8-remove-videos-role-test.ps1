$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = (Get-Location).Path
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$parent = Split-Path $root -Parent
$backupRoot = Join-Path $parent ("lexdata_v8_auth_test_backup_" + $stamp)

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

function Write-Utf8File([string]$Path, [string]$Content) {
    $dir = Split-Path $Path -Parent
    if ($dir -and !(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Backup-File([string]$RelativePath) {
    $src = Join-Path $root $RelativePath

    if (Test-Path $src) {
        $dest = Join-Path $backupRoot $RelativePath
        $destDir = Split-Path $dest -Parent

        if ($destDir) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }

        Copy-Item $src $dest -Force
    }
}

Write-Host "LexData V8 - remove homepage video sections and add role test page" -ForegroundColor Cyan
Write-Host "Project root: $root"
Write-Host "Backup: $backupRoot"
Write-Host ""

if (!(Test-Path (Join-Path $root "package.json"))) {
    throw "package.json was not found. Run this script from the Next.js project root."
}

Backup-File "components\IntegratedHomePage.tsx"
Backup-File "app\dev\role-test\page.tsx"

# -------------------------------------------------------------------
# 1. Remove the three homepage video/media sections shown in screenshots
#    These are rendered inside the lx-media-section:
#      - EditorialVideoShowcase
#      - HomeMediaShowcase
#      - HomeVideoSpotlight / LatestWorkshopVideos
# -------------------------------------------------------------------

$homePath = Join-Path $root "components\IntegratedHomePage.tsx"

if (!(Test-Path $homePath)) {
    throw "components\IntegratedHomePage.tsx was not found."
}

$homePageContent = [System.IO.File]::ReadAllText($homePath)

$videoImports = @(
    'import\s+HomeMediaShowcase\s+from\s+["'']@/components/HomeMediaShowcase["''];?\r?\n',
    'import\s+HomeVideoSpotlight\s+from\s+["'']@/components/HomeVideoSpotlight["''];?\r?\n',
    'import\s+LatestWorkshopVideos\s+from\s+["'']@/components/LatestWorkshopVideos["''];?\r?\n',
    'import\s+EditorialVideoShowcase\s+from\s+["'']@/components/EditorialVideoShowcase["''];?\r?\n',
    'import\s+\{\s*editorialVideos\s*\}\s+from\s+["'']@/content/editorialVideos["''];?\r?\n'
)

foreach ($pattern in $videoImports) {
    $homePageContent = [regex]::Replace(
        $homePageContent,
        $pattern,
        '',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
}

$mediaPattern = '(?s)\s*<section\s+className="lx-media-section"\s+id="media">.*?</section>\s*'

if ([regex]::IsMatch($homePageContent, $mediaPattern)) {
    $homePageContent = [regex]::Replace(
        $homePageContent,
        $mediaPattern,
        "`r`n",
        1
    )
    Write-Host "Removed the homepage media/video section." -ForegroundColor Green
}
else {
    # Fallback for older layouts where components are not wrapped in lx-media-section.
    $fallbackPatterns = @(
        '(?s)\s*<EditorialVideoShowcase\s+videos=\{editorialVideos\}\s*/>\s*',
        '(?s)\s*<HomeMediaShowcase\s+videos=\{\[\]\}\s*/>\s*',
        '(?s)\s*<HomeVideoSpotlight\s*/>\s*',
        '(?s)\s*<LatestWorkshopVideos\s*/>\s*'
    )

    foreach ($pattern in $fallbackPatterns) {
        $homePageContent = [regex]::Replace($homePageContent, $pattern, "`r`n")
    }

    Write-Host "Removed standalone homepage video components using fallback matching." -ForegroundColor Yellow
}

Write-Utf8File $homePath $homePageContent

# -------------------------------------------------------------------
# 2. Add a DEVELOPMENT-ONLY role test page.
#    This lets one logged-in test account switch its profile role locally
#    between user, speaker, manager, and admin.
#    The page returns 404 in production.
# -------------------------------------------------------------------

$roleTestPage = @'
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TEST_ROLES = ["user", "speaker", "manager", "admin"] as const;
type TestRole = (typeof TEST_ROLES)[number];

function isTestRole(value: string): value is TestRole {
  return TEST_ROLES.includes(value as TestRole);
}

function roleLabel(role: string) {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  if (role === "speaker") return "Speaker";
  return "Member";
}

async function setDevelopmentRole(formData: FormData) {
  "use server";

  if (process.env.NODE_ENV === "production") {
    throw new Error("Role test mode is disabled in production.");
  }

  const role = String(formData.get("role") || "").trim().toLowerCase();

  if (!isTestRole(role)) {
    throw new Error("Invalid test role.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dev/role-test");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", user.id);

  if (error) {
    throw new Error(`Could not update test role: ${error.message}`);
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/manager");
  revalidatePath("/speaker");
  revalidatePath("/admin");

  redirect(`/dev/role-test?role=${encodeURIComponent(role)}`);
}

export default async function DevelopmentRoleTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dev/role-test");
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role, full_name, name")
    .eq("id", user.id)
    .maybeSingle();

  const currentRole = String(profile?.role || "user").toLowerCase();
  const displayName =
    profile?.full_name ||
    profile?.name ||
    user.email?.split("@")[0] ||
    "Test user";

  const routes = [
    {
      href: "/dashboard",
      title: "Member Dashboard",
      note: "Should be available to every logged-in account.",
      expected: true,
    },
    {
      href: "/dashboard/messages",
      title: "Messages",
      note: "Test member messages and unread message behavior.",
      expected: true,
    },
    {
      href: "/my/workshops",
      title: "My Workshops",
      note: "Test registrations and workshop access for the logged-in member.",
      expected: true,
    },
    {
      href: "/speaker",
      title: "Speaker Dashboard",
      note: "Expected for the speaker role.",
      expected: currentRole === "speaker",
    },
    {
      href: "/manager",
      title: "Manager Dashboard",
      note: "Expected for the manager role.",
      expected: currentRole === "manager",
    },
    {
      href: "/admin",
      title: "Admin Dashboard",
      note: "Expected for the admin role.",
      expected: currentRole === "admin",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">
            Development only
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
            Login and role test console
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            Use one test account to verify the member, speaker, manager, and
            admin dashboard experience. This page is automatically unavailable
            in production.
          </p>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Current session
            </p>
            <h2 className="mt-3 text-2xl font-black">{displayName}</h2>
            <p className="mt-2 break-all text-sm text-slate-600">{user.email}</p>

            {error ? (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                Profile read error: {error.message}
              </p>
            ) : null}

            <div className="mt-5 rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-100">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                Current role
              </p>
              <p className="mt-2 text-3xl font-black text-blue-950">
                {roleLabel(currentRole)}
              </p>
              <p className="mt-1 font-mono text-xs text-blue-700">
                profiles.role = {currentRole}
              </p>
            </div>

            <form action={setDevelopmentRole} className="mt-6">
              <p className="mb-3 text-sm font-black">Switch test role</p>
              <div className="grid grid-cols-2 gap-2">
                {TEST_ROLES.map((role) => (
                  <button
                    key={role}
                    type="submit"
                    name="role"
                    value={role}
                    className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                      currentRole === role
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    {roleLabel(role)}
                  </button>
                ))}
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black"
              >
                Homepage
              </Link>
              <Link
                href="/logout"
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white"
              >
                Logout
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Route checks
            </p>
            <h2 className="mt-3 text-3xl font-black">Test each dashboard</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Change the role on the left, then open the relevant route below.
              A role-protected route should allow the correct role and reject or
              redirect the wrong role.
            </p>

            <div className="mt-6 grid gap-3">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:bg-blue-50"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{route.title}</h3>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                          route.expected
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {route.expected ? "Expected access" : "Expected restricted"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{route.note}</p>
                    <p className="mt-2 font-mono text-xs text-slate-400">
                      {route.href}
                    </p>
                  </div>
                  <span className="text-2xl transition group-hover:translate-x-1">
                    &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-black">Recommended test sequence</h2>
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
            <li className="rounded-2xl bg-slate-50 p-4">
              1. Set role to Member and verify Dashboard, Messages, and My Workshops.
            </li>
            <li className="rounded-2xl bg-slate-50 p-4">
              2. Try Manager, Speaker, and Admin routes as Member. They should not expose protected controls.
            </li>
            <li className="rounded-2xl bg-slate-50 p-4">
              3. Set role to Speaker and verify the Speaker Dashboard and attendee/session pages.
            </li>
            <li className="rounded-2xl bg-slate-50 p-4">
              4. Set role to Manager and verify registrations, payments, notices, workshops, and monitoring.
            </li>
            <li className="rounded-2xl bg-slate-50 p-4">
              5. Set role to Admin and verify Admin Dashboard and admin-only management routes.
            </li>
            <li className="rounded-2xl bg-slate-50 p-4">
              6. Logout, login again, and repeat the final role to confirm the real login session keeps the correct access.
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
'@

Write-Utf8File (Join-Path $root "app\dev\role-test\page.tsx") $roleTestPage

# -------------------------------------------------------------------
# 3. Write a local test guide
# -------------------------------------------------------------------

$testGuide = @'
LEXDATA LOGIN AND ROLE TESTING

The V8 patch adds this development-only page:

http://localhost:3000/dev/role-test

HOW TO USE IT

1. Start the site:
   npm.cmd run dev

2. Open:
   http://localhost:3000/login

3. Login with a TEST account.

4. Open:
   http://localhost:3000/dev/role-test

5. Switch the current test account between:
   user
   speaker
   manager
   admin

6. Test these routes:

   Member:
   /dashboard
   /dashboard/messages
   /my/workshops

   Speaker:
   /speaker

   Manager:
   /manager
   /manager/registrations
   /manager/payments
   /manager/notices
   /manager/workshops
   /manager/monitor

   Admin:
   /admin
   /admin/registrations
   /admin/users
   /admin/workshops
   /admin/team

IMPORTANT

- The role test page is blocked in production.
- Use a test account, not your real production admin account.
- Role switching updates the logged-in test user's profiles.role value.
- After switching a role, refresh/open the target dashboard.
- For a full login test, logout and login again after setting the desired role.

EXPECTED ROLE VALUES

user
speaker
manager
admin
'@

Write-Utf8File (Join-Path $root "ROLE-TESTING.md") $testGuide

# -------------------------------------------------------------------
# 4. Move stale generated backup folders outside the project
# -------------------------------------------------------------------

Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Name -like "_ellipsus_art_backup_*" -or
        $_.Name -like "_lexdata_*_backup_*"
    } |
    ForEach-Object {
        $safeDest = Join-Path $parent ("archived_" + $_.Name + "_" + $stamp)
        Move-Item $_.FullName $safeDest -Force
        Write-Host "Moved old backup outside project: $($_.Name)" -ForegroundColor Yellow
    }

# -------------------------------------------------------------------
# 5. Clear Next.js cache
# -------------------------------------------------------------------

$nextDir = Join-Path $root ".next"
if (Test-Path $nextDir) {
    Remove-Item -Recurse -Force $nextDir
}

Write-Host ""
Write-Host "V8 applied successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Homepage:" -ForegroundColor Cyan
Write-Host "  - Removed the three video/media displays shown in your screenshots."
Write-Host "  - Kept the workshop notice/poster slider."
Write-Host ""
Write-Host "Role testing:" -ForegroundColor Cyan
Write-Host "  - Added /dev/role-test"
Write-Host "  - Added ROLE-TESTING.md"
Write-Host "  - The role test page is unavailable in production."
Write-Host ""
Write-Host "Next commands:" -ForegroundColor Cyan
Write-Host "  npm.cmd run build"
Write-Host "  npm.cmd run dev"
Write-Host ""
Write-Host "After login, open:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/dev/role-test"

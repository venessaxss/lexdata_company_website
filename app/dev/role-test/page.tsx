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
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomeControlPanelButton() {
  noStore();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name?: string | null; role?: string | null } | null =
    null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    profile = data;
  }

  const role = profile?.role ?? null;
  const isAdmin = role === "admin";

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email;

  if (!user) {
    return (
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
                  Member Access
                </p>

                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  Access your LexData account
                </h2>

                <p className="mt-2 max-w-2xl text-slate-600">
                  Create an account or login to access your personal dashboard,
                  workshop registrations, messages, and learning materials.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                >
                  Create account
                </Link>

                <Link
                  href="/login"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-white"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
                Control Panel
              </p>

              <h2 className="mt-3 text-2xl font-black">
                {displayName ? `Welcome back, ${displayName}` : "Welcome back"}
              </h2>

              <p className="mt-2 max-w-2xl text-slate-300">
                {isAdmin
                  ? "Open your admin dashboard to manage workshops, registrations, homepage media, users, and website content."
                  : "Open your dashboard to view your learning, messages, registrations, and workshop access."}
              </p>
            </div>

            <Link
              href={isAdmin ? "/admin" : "/dashboard"}
              className="w-fit rounded-xl bg-white px-6 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
            >
              {isAdmin ? "Open Admin Dashboard" : "Open My Dashboard"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
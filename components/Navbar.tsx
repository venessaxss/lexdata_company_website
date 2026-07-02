import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import { normalizeRole } from "@/lib/roles";
import { normalizeLanguage } from "@/lib/languages";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type Profile = {
  role?: string | null;
  full_name?: string | null;
};

const publicLinks = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Workshops",
    href: "/workshops",
  },
  {
    label: "Notices",
    href: "/notices",
  },
];

export default async function Navbar() {
  const cookieStore = await cookies();

  const currentLanguage = normalizeLanguage(
    cookieStore.get("lexdata_language")?.value
  );

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    profile = profileData as Profile | null;
  }

  const role = normalizeRole(profile?.role);

  const isAdmin = role === "admin";
  const isManager = role === "manager";

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
              LD
            </div>

            <div>
              <p className="text-lg font-black tracking-tight text-slate-950">
                {site.name}
              </p>
              <p className="hidden text-xs font-semibold text-slate-500 sm:block">
                Research Training Platform
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            {publicLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}

            {user ? (
              <Link
                href="/dashboard/my-learning"
                className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              >
                My Learning
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLanguage={currentLanguage} compact />

          {user ? (
            <>
              <div className="hidden text-right md:block">
                <p className="max-w-[180px] truncate text-sm font-bold text-slate-950">
                  {displayName}
                </p>
                <p className="text-xs font-semibold capitalize text-slate-500">
                  {role}
                </p>
              </div>

              {isAdmin ? (
                <Link
                  href="/admin"
                  className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 md:inline-flex"
                >
                  Admin
                </Link>
              ) : null}

              {isManager || isAdmin ? (
                <Link
                  href="/manager"
                  className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 md:inline-flex"
                >
                  Manager
                </Link>
              ) : null}

              <Link
                href="/dashboard"
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="hidden rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 sm:inline-flex"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import { normalizeRole } from "@/lib/roles";
import { getServerI18n } from "@/lib/language-server";
import { translateRole } from "@/lib/languages";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type Profile = {
  role?: string | null;
  full_name?: string | null;
};

async function signOutAction() {
  "use server";

  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/");
}

export default async function Navbar() {
  const { language, t } = await getServerI18n();

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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo2.png"
              alt={site.name}
              className="h-11 w-auto object-contain"
            />

            <div className="hidden sm:block">
              <p className="text-lg font-black tracking-tight text-slate-950">
                {site.name}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {site.tagline}
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/"
              className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              {t("nav.home")}
            </Link>

            <Link
              href="/workshops"
              className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              {t("nav.workshops")}
            </Link>

            <Link
              href="/notices"
              className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              {t("nav.notices")}
            </Link>

            {user ? (
              <Link
                href="/dashboard/my-learning"
                className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              >
                {t("nav.myLearning")}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLanguage={language} compact />

          {user ? (
            <>
              <div className="hidden text-right md:block">
                <p className="max-w-[180px] truncate text-sm font-bold text-slate-950">
                  {displayName}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {translateRole(language, role)}
                </p>
              </div>

              {isAdmin ? (
                <Link
                  href="/admin"
                  className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 md:inline-flex"
                >
                  {t("nav.admin")}
                </Link>
              ) : null}

              {isManager || isAdmin ? (
                <Link
                  href="/manager"
                  className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 md:inline-flex"
                >
                  {t("nav.manager")}
                </Link>
              ) : null}

              <Link
                href="/dashboard"
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
              >
                {t("nav.dashboard")}
              </Link>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                {t("nav.login")}
              </Link>

              <Link
                href="/signup"
                className="hidden rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 sm:inline-flex"
              >
                {t("nav.signup")}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
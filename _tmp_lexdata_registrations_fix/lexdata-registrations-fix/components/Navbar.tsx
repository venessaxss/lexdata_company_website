import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

  revalidatePath("/", "layout");
  redirect("/");
}

export default async function Navbar() {
  const { language, t } = await getServerI18n();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let unreadMessageCount = 0;
  
  if (user) {
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  unreadMessageCount = count || 0;
}


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
  const canManage = isAdmin || isManager;

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <img
              src="/logo2.png"
              alt={site.name}
              className="h-10 w-auto object-contain"
            />

            <div className="hidden sm:block">
              <p className="text-base font-black tracking-tight text-slate-950">
                {site.name}
              </p>
              <p className="max-w-[190px] truncate text-xs font-semibold text-slate-500">
                {site.tagline}
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
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

            <details className="relative">
              <summary className="cursor-pointer list-none rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">
                More
              </summary>

              <div className="absolute left-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <Link
                  href="/team"
                  className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Team
                </Link>

                <Link
                  href="/about"
                  className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  About
                </Link>

                <Link
                  href="/contact"
                  className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Contact
                </Link>
              </div>
            </details>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher currentLanguage={language} compact />

          {user ? (
            <>
              <Link
  href="/dashboard/messages"
  className="relative hidden rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100 md:inline-flex"
>
  Messages

  {unreadMessageCount > 0 ? (
    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white">
      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
    </span>
  ) : null}
</Link>

              <Link
                href="/dashboard"
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-700"
              >
                {t("nav.dashboard")}
              </Link>

              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  <span className="hidden max-w-[130px] truncate md:inline">
                    {displayName}
                  </span>
                  <span className="md:hidden">Menu</span>
                  <span>▾</span>
                </summary>

                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="truncate text-sm font-black text-slate-950">
                      {displayName}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {translateRole(language, role)}
                    </p>
                  </div>

                  <Link
  href="/dashboard/messages"
  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 md:hidden"
>
  <span>Messages</span>

  {unreadMessageCount > 0 ? (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white">
      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
    </span>
  ) : null}
</Link>
                  <Link
                    href="/dashboard/my-learning"
                    className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    My Learning
                  </Link>

                  <Link
                    href="/dashboard/settings/language"
                    className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Language
                  </Link>

                  {canManage ? (
                    <>
                      <div className="my-2 border-t border-slate-100" />

                      <Link
                        href="/manager"
                        className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Manager Panel
                      </Link>

                      <Link
                        href="/manager/registrations"
                        className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Registrations
                      </Link>

                      <Link
                        href="/manager/notices"
                        className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Notices
                      </Link>

                      <Link
                        href="/manager/team"
                        className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Team
                      </Link>
                    </>
                  ) : null}

                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Admin Panel
                    </Link>
                  ) : null}

                  <div className="my-2 border-t border-slate-100" />

                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-black text-red-700 hover:bg-red-50"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              </details>
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
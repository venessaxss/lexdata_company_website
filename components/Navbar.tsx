import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import LiveQaHelpWidget from "@/components/LiveQaHelpWidget";
import { logoutAction } from "@/app/logout/actions";

type UserRole = "admin" | "manager" | "speaker" | "user" | null;

function roleLabel(role: UserRole) {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  if (role === "speaker") return "Speaker";
  return "Member";
}

export default async function Navbar() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: UserRole = null;
  let displayName = "";
  let unreadMessageCount = 0;

  if (user) {
    const { data: profile } = await admin
      .from("profiles")
      .select("role, full_name, name")
      .eq("id", user.id)
      .maybeSingle();

    role = (profile?.role || "user") as UserRole;
    displayName =
      profile?.full_name ||
      profile?.name ||
      user.email?.split("@")[0] ||
      "Member";
  }
    const messageFilters = [`user_id.eq.${user.id}`];

if (user.email) {
  messageFilters.push(`recipient_email.eq.${user.email}`);
}

const { count } = await admin
  .from("internal_messages")
  .select("id", { count: "exact", head: true })
  .or(messageFilters.join(","))
  .is("read_at", null);

unreadMessageCount = count ?? 0;
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isSpeaker = role === "speaker";
  const isAdminOrManager = isAdmin || isManager;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
  <div className="flex h-14 w-14 items-center justify-center overflow-visible rounded-2xl bg-white p-1">
    <img
      src="/logo2.png"
      alt="LexData Logo"
      className="h-full w-full object-contain"
    />
  </div>

  <div>
    <p className="text-lg font-black leading-none text-slate-950">
      LexData
    </p>
    <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
      AI · NLP · RESEARCH
    </p>
  </div>
</Link>
          <div className="hidden items-center gap-1 lg:flex">
            <Link
              href="/courses"
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            >
              Courses
            </Link>

            <Link
              href="/workshops"
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            >
              Workshops
            </Link>

            <Link
              href="/services"
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            >
              Services
            </Link>

            <Link
              href="/team"
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            >
              Team
            </Link>

            <Link
              href="/member-manual"
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            >
              Manual
            </Link>

            <Link
              href="/contact"
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            >
              Contact
            </Link>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <>
                <div className="rounded-2xl bg-slate-50 px-4 py-2 ring-1 ring-slate-200">
                  <p className="max-w-40 truncate text-sm font-black text-slate-950">
                    {displayName}
                  </p>
                  <p className="text-xs font-bold text-blue-700">
                    {roleLabel(role)}
                  </p>
                </div>

                <Link
                  href="/dashboard"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-50"
                >
                  Dashboard
                </Link>

                <form action={logoutAction}>
  <button
    type="submit"
    className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-red-700"
  >
    Logout
  </button>
</form>

                {isSpeaker ? (
                  <Link
                    href="/speaker"
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-50"
                  >
                    Speaker
                  </Link>
                ) : null}

                {isManager ? (
                  <Link
                    href="/manager"
                    className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-800"
                  >
                    Manager
                  </Link>

                ) : null}

                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-700"
                  >
                    Admin
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <details className="relative lg:hidden">
            <summary className="list-none rounded-xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-800">
              Menu
            </summary>

            <div className="absolute right-0 mt-3 w-80 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
              <div className="grid gap-2">
                <Link
                  href="/courses"
                  className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Courses
                </Link>

                <Link
                  href="/workshops"
                  className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Workshops
                </Link>

                <Link
                  href="/services"
                  className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Services
                </Link>

                <Link
                  href="/team"
                  className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Team
                </Link>

                <Link
                  href="/member-manual"
                  className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  User Manual
                </Link>

                <Link
                  href="/contact"
                  className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Contact
                </Link>

                <div className="my-2 h-px bg-slate-200" />

                {user ? (
                  <>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="truncate text-sm font-black text-slate-950">
                        {displayName}
                      </p>
                      <p className="mt-1 text-xs font-bold text-blue-700">
                        {roleLabel(role)}
                      </p>
                    </div>
                     
                     <Link
  href="/dashboard/messages"
  className="relative rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-800"
>
  Messages

  {unreadMessageCount > 0 ? (
    <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-black text-white ring-2 ring-white">
      {unreadMessageCount}
    </span>
  ) : null}
</Link>


                    <Link
                      href="/dashboard"
                      className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                    >
                      Dashboard
                    </Link>

                    <Link
                      href="/dashboard/my-learning"
                      className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    >
                      My Learning
                    </Link>

                    <Link
  href="/dashboard/messages"
  className="relative rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white"
>
  Messages

  {unreadMessageCount > 0 ? (
    <span className="ml-2 rounded-full bg-red-600 px-2 py-1 text-xs font-black text-white">
      {unreadMessageCount}
    </span>
  ) : null}
</Link>
                    <Link
                      href="/my/workshops"
                      className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    >
                      My Workshops
                    </Link>

                    {isSpeaker ? (
                      <Link
                        href="/speaker"
                        className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Speaker Dashboard
                      </Link>
                    ) : null}

                    {isManager ? (
                      <>
                        <Link
                          href="/manager"
                          className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white"
                        >
                          Manager Dashboard
                        </Link>

                        <Link
                          href="/manager/registrations"
                          className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Manage Registrations
                        </Link>
        
                        <Link
                          href="/manager/live-help"
                          className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Live Help Desk
                        </Link>
                        <form action={logoutAction}>
  <button
    type="submit"
    className="w-full rounded-2xl bg-red-600 px-4 py-3 text-left text-sm font-black text-white hover:bg-red-700"
  >
    Logout
  </button>
</form>
                      </>
                    ) : null}

                    {isAdmin ? (
                      <>
                        <Link
                          href="/admin"
                          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                        >
                          Admin Dashboard
                        </Link>

                        <Link
                          href="/admin/registrations"
                          className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Admin Registrations
                        </Link>

                        <Link
                          href="/admin/live-help"
                          className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Admin Live Help
                        </Link>
                      </>
                    ) : null}

                    {isAdminOrManager ? (
                      <Link
                        href={isAdmin ? "/admin/live-help" : "/manager/live-help"}
                        className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700"
                      >
                        Q&A Requests
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-2xl px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
                    >
                      Login
                    </Link>

                    <Link
                      href="/register"
                      className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </details>
        </nav>
      </header>

      <LiveQaHelpWidget />
    </>
  );
}
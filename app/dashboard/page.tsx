import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dashboardCards = [
  {
    title: "My Learning",
    description:
      "View your registered workshops, payment status, and unlocked session arrangements.",
    href: "/dashboard/my-learning",
  },
  {
    title: "Message Box",
    description:
      "Check payment links, workshop updates, and next-step messages from LexData.",
    href: "/dashboard/messages",
  },
  {
    title: "Browse Workshops",
    description:
      "Explore available LexData workshops and register for new training programs.",
    href: "/workshops",
  },
  {
    title: "Browse Courses",
    description:
      "Explore LexData courses, learning paths, and research training programs.",
    href: "/courses",
  },
  {
    title: "Payment",
    description:
      "View payment-related information and continue payment steps when available.",
    href: "/payment",
  },
  {
    title: "My Profile",
    description:
      "View or update your member profile and account information.",
    href: "/my",
  },
];

export default async function DashboardPage() {
  noStore();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-10 rounded-3xl bg-slate-950 px-8 py-10 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          Member Dashboard
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
          Welcome back{displayName ? `, ${displayName}` : ""}
        </h1>

        <p className="mt-4 max-w-2xl text-slate-300">
          Manage your learning, workshop registrations, payment steps, and
          LexData messages from one place.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/my-learning"
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
          >
            Open My Learning
          </Link>

          <Link
            href="/dashboard/messages"
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Open Message Box
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dashboardCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-xl font-black text-slate-950">
              {card.title}
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              {card.description}
            </p>

            <span className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">
              Open
            </span>
          </Link>
        ))}
      </section>

      {profile?.role === "admin" || profile?.role === "manager" ? (
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            Staff shortcuts
          </h2>

          <p className="mt-3 text-slate-600">
            Your account has staff access. Use these shortcuts to manage
            workshop registrations and website content.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {profile.role === "admin" ? (
              <>
                <Link
                  href="/admin"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                >
                  Admin Dashboard
                </Link>

                <Link
                  href="/admin/registrations"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Registration Records
                </Link>
              </>
            ) : null}

            {profile.role === "manager" ? (
              <>
                <Link
                  href="/manager"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                >
                  Manager Dashboard
                </Link>

                <Link
                  href="/manager/registrations"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Registration Records
                </Link>
              </>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
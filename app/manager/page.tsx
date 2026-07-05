import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ManagerCard = {
  title: string;
  description: string;
  href: string;
};

export default async function ManagerDashboardPage() {
  noStore();

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/manager");
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = normalizeRole(profile?.role);

  if (role !== "admin" && role !== "manager") {
    redirect("/dashboard");
  }

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email;

  const cards: ManagerCard[] = [
    {
      title: "Overall Monitoring Board",
      description:
        "View website visits, registration statistics, payment statistics, workshop status, course status, and recent user activity.",
      href: "/manager/monitor",
    },
    {
      title: "Registration & Payment Management",
      description:
        "Review workshop registrations, send payment instructions, check uploaded receipts, confirm payments, waive payments, and unlock access.",
      href: "/manager/registrations",
    },
    {
      title: "Workshop Status Management",
      description:
        "Control workshop recruitment status, course process status, public notes, internal notes, and termination or completion status.",
      href: "/manager/workshops",
    },
    {
      title: "Notice Management",
      description:
        "Publish homepage notices, public announcements, workshop updates, media notices, and platform messages.",
      href: "/manager/notices",
    },
    {
      title: "Team Management",
      description:
        "Add team members, upload photos, edit bios, set titles, manage links, and publish the public team page.",
      href: "/manager/team",
    },
    {
      title: "Public Notices",
      description:
        "Open the public notice center and check how published notices appear to website visitors.",
      href: "/notices",
    },
    {
      title: "Public Team Page",
      description:
        "Open the public team page and review how published team members appear to visitors.",
      href: "/team",
    },
    {
      title: "Workshops",
      description:
        "Open the public workshop list and check workshop visibility, registration status, and member-facing content.",
      href: "/workshops",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-10 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
          Manager Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          Welcome, {displayName}
        </h1>

        <p className="mt-4 max-w-3xl text-slate-300">
          Manage registrations, payments, notices, workshops, monitoring data,
          and team information from one place.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-full bg-white/10 px-4 py-2">
            Role: {role}
          </span>

          <span className="rounded-full bg-white/10 px-4 py-2">
            {user.email}
          </span>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-xl font-black text-slate-950">
              {card.title}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {card.description}
            </p>

            <p className="mt-5 text-sm font-bold text-blue-700">Open →</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Profile = {
  full_name?: string | null;
  role?: string | null;
};

const baseCards = [
  {
    title: "My Learning",
    description:
      "View your registered workshops, confirmed access, sessions, subsessions, materials, and recordings.",
    href: "/dashboard/my-learning",
  },
  {
    title: "Message Box",
    description:
      "Read payment notices, workshop updates, internal messages, and announcements sent to your account.",
    href: "/dashboard/messages",
  },
  {
    title: "Language Settings",
    description:
      "Choose English, Chinese, Mongolian, Arabic, Urdu, Azerbaijani, Turkish, Japanese, or Korean as your preferred website language.",
    href: "/dashboard/settings/language",
  },
  {
    title: "Change Password",
    description: "Update the password for your LexData account.",
    href: "/dashboard/settings/password",
  },
  {
    title: "Workshops",
    description: "Browse available workshops and submit new registrations.",
    href: "/workshops",
  },
  {
    title: "Notice Center",
    description:
      "View public notices, announcements, media releases, and platform updates.",
    href: "/notices",
  },
];

export default async function DashboardPage() {
  noStore();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as Profile | null;

  const role = normalizeRole(profile?.role);

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email;

  const cards = [...baseCards];

  if (role === "admin") {
    cards.unshift({
      title: "Admin Dashboard",
      description:
        "Manage users, roles, workshops, registrations, payments, notices, media, and website content.",
      href: "/admin",
    });
  }

  if (role === "manager" || role === "admin") {
    cards.unshift({
      title: "Manager Dashboard",
      description:
        "Manage registrations, manual payments, payment records, notices, workshop status, and monitoring data.",
      href: "/manager",
    });

    cards.unshift({
      title: "Overall Monitoring Board",
      description:
        "View registration statistics, payment statistics, website visits, workshop status, course status, and user activity.",
      href: "/manager/monitor",
    });
  }

  if (role === "speaker") {
    cards.unshift({
      title: "Speaker Access",
      description:
        "Open assigned workshop sessions and view speaker-related messages.",
      href: "/workshops",
    });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-10 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          Welcome, {displayName}
        </h1>

        <p className="mt-4 max-w-3xl text-slate-300">
          Manage your learning, messages, registrations, language settings, and
          account tools from one place.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-full bg-white/10 px-4 py-2 capitalize">
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

            <p className="mt-5 text-sm font-bold text-blue-700">
              Open →
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Profile = {
  full_name?: string | null;
  role?: string | null;
};

export default async function DashboardPage() {
  noStore();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as Profile | null;

  const role = profile?.role || "student";

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email;

  const canSendMessages =
    role === "admin" || role === "manager" || role === "speaker";

  const cards = [
    {
      title: "My Learning",
      description:
        "View your registered workshops, payment status, and unlocked session arrangements.",
      href: "/dashboard/my-learning",
    },
    {
      title: "Messages",
      description:
        "Check workshop updates, payment links, learning notices, and team messages.",
      href: "/dashboard/messages",
    },
    {
      title: "Change Password",
      description: "Update the password for your LexData account.",
      href: "/dashboard/settings/password",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
              LexData Dashboard
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Welcome back{displayName ? `, ${displayName}` : ""}
            </h1>

            <p className="mt-4 max-w-2xl text-slate-300">
              Access your learning materials, messages, account settings, and
              workshop information from one place.
            </p>

            <p className="mt-3 text-sm font-semibold text-slate-400">
              Current role: {role}
            </p>
          </div>

          {role === "admin" ? (
            <Link
              href="/admin"
              className="w-fit rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
            >
              Open Admin Dashboard
            </Link>
          ) : null}
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-2xl font-black text-slate-950">
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

        {canSendMessages ? (
          <Link
            href="/dashboard/messages/send"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-2xl font-black text-slate-950">
              Send Messages
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Send messages to all users or to selected role groups such as
              students, speakers, managers, or admins.
            </p>

            <span className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">
              Send message
            </span>
          </Link>
        ) : null}
      </section>
    </main>
  );
}
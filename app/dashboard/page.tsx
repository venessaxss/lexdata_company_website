import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/roles";
import { getServerI18n } from "@/lib/language-server";
import { translateRole } from "@/lib/languages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Profile = {
  full_name?: string | null;
  role?: string | null;
};

export default async function DashboardPage() {
  noStore();

  const { language, t } = await getServerI18n();

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

  const cards = [
    {
      title: t("card.myLearning.title"),
      description: t("card.myLearning.description"),
      href: "/dashboard/my-learning",
    },
    {
      title: t("card.messages.title"),
      description: t("card.messages.description"),
      href: "/dashboard/messages",
    },
    {
      title: t("card.language.title"),
      description: t("card.language.description"),
      href: "/dashboard/settings/language",
    },
    {
      title: t("card.password.title"),
      description: t("card.password.description"),
      href: "/dashboard/settings/password",
    },
    {
      title: t("card.workshops.title"),
      description: t("card.workshops.description"),
      href: "/workshops",
    },
    {
      title: t("card.notices.title"),
      description: t("card.notices.description"),
      href: "/notices",
    },
  ];

  if (role === "admin") {
    cards.unshift({
      title: t("card.admin.title"),
      description: t("card.admin.description"),
      href: "/admin",
    });
  }

  if (role === "manager" || role === "admin") {
    cards.unshift({
      title: t("card.manager.title"),
      description: t("card.manager.description"),
      href: "/manager",
    });

    cards.unshift({
      title: t("card.monitor.title"),
      description: t("card.monitor.description"),
      href: "/manager/monitor",
    });
  }

  if (role === "speaker") {
    cards.unshift({
      title: t("card.speaker.title"),
      description: t("card.speaker.description"),
      href: "/workshops",
    });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-10 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          {t("dashboard.title")}
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          {t("dashboard.welcome")}, {displayName}
        </h1>

        <p className="mt-4 max-w-3xl text-slate-300">
          {t("dashboard.subtitle")}
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-full bg-white/10 px-4 py-2">
            {t("dashboard.role")}: {translateRole(language, role)}
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
              {t("card.open")} →
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
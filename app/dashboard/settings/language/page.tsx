import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGE_LABELS } from "@/lib/languages";
import { getServerI18n } from "@/lib/language-server";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LanguageSettingsPage() {
  noStore();

  const { language, t } = await getServerI18n();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/unauthorized");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-10">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          -&gt;{t("common.backDashboard")}
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
          {t("language.title")}
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          {t("language.title")}
        </h1>

        <p className="mt-4 max-w-2xl text-slate-600">
          {t("language.subtitle")}
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          {t("language.preferred")}
        </h2>

        <p className="mt-3 text-slate-600">
          {t("language.current")}:{" "}
          <span className="font-bold text-slate-950">
            {LANGUAGE_LABELS[language]}
          </span>
        </p>

        <div className="mt-6">
          <LanguageSwitcher currentLanguage={language} />
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          {t("language.available")}
        </div>
      </section>
    </main>
  );
}
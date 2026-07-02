import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGE_LABELS, normalizeLanguage } from "@/lib/languages";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Profile = {
  preferred_language?: string | null;
};

export default async function LanguageSettingsPage() {
  noStore();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/settings/language");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as Profile | null;

  const cookieStore = await cookies();

  const currentLanguage = normalizeLanguage(
    profile?.preferred_language || cookieStore.get("lexdata_language")?.value
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-10">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to dashboard
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
          Account Settings
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Language Settings
        </h1>

        <p className="mt-4 max-w-2xl text-slate-600">
          Choose the language you prefer to use on LexData. Your choice will be
          saved to your account and used again when you login.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Preferred language
        </h2>

        <p className="mt-3 text-slate-600">
          Current language:{" "}
          <span className="font-bold text-slate-950">
            {LANGUAGE_LABELS[currentLanguage]}
          </span>
        </p>

        <div className="mt-6">
          <LanguageSwitcher currentLanguage={currentLanguage} />
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          Available languages: English, Chinese, Mongolian, Arabic, Urdu,
          Azerbaijani, Turkish, Japanese, and Korean.
        </div>
      </section>
    </main>
  );
}
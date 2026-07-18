import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateMemberProfileAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MemberProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();

  const sp = await searchParams;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/profile");
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/dashboard" className="text-sm font-black text-blue-700">
        ← Back to dashboard
      </Link>

      <section className="mt-6 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
          Member Profile
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Complete your LexData profile
        </h1>

        <p className="mt-4 max-w-3xl text-slate-300">
          Please add your institution, profession, country, academic background,
          and research interests. This helps LexData understand members,
          registrations, certificates, and learning needs.
        </p>
      </section>

      {sp.message ? (
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
          {sp.message}
        </div>
      ) : null}

      <form
        action={updateMemberProfileAction}
        className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-black text-slate-600">
              Full name *
            </label>
            <input
              name="full_name"
              defaultValue={
                profile?.full_name ||
                user.user_metadata?.full_name ||
                user.email?.split("@")[0] ||
                ""
              }
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600">
              Email
            </label>
            <input
              value={user.email || ""}
              disabled
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600">
              Institution / University *
            </label>
            <input
              name="institution"
              defaultValue={profile?.institution || ""}
              placeholder="e.g. Shanghai International Studies University"
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600">
              Department / Faculty
            </label>
            <input
              name="department"
              defaultValue={profile?.department || ""}
              placeholder="e.g. Faculty of Languages"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600">
              Affiliation
            </label>
            <input
              name="affiliation"
              defaultValue={profile?.affiliation || ""}
              placeholder="e.g. Department of Applied Linguistics"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600">
              Affiliation status
            </label>
            <select
              name="affiliation_status"
              defaultValue={profile?.affiliation_status || ""}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
            >
              <option value="">Select status</option>
              <option value="Student">Student</option>
              <option value="Faculty Member">Faculty Member</option>
              <option value="Researcher">Researcher</option>
              <option value="Industry Professional">Industry Professional</option>
              <option value="Independent Scholar">Independent Scholar</option>
              <option value="Institutional Staff">Institutional Staff</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600">
              Profession / academic status *
            </label>
            <select
              name="profession_status"
              defaultValue={profile?.profession_status || ""}
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
            >
              <option value="">Select profession</option>
              <option value="Undergraduate Student">Undergraduate Student</option>
              <option value="Master Student">Master Student</option>
              <option value="PhD Student">PhD Student</option>
              <option value="Postdoctoral Researcher">Postdoctoral Researcher</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Professor">Professor</option>
              <option value="Researcher">Researcher</option>
              <option value="Teacher">Teacher</option>
              <option value="Translator / Interpreter">Translator / Interpreter</option>
              <option value="Data Analyst">Data Analyst</option>
              <option value="Industry Professional">Industry Professional</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600">
              Profession title
            </label>
            <input
              name="profession_title"
              defaultValue={profile?.profession_title || ""}
              placeholder="e.g. Lecturer, PhD Candidate, Research Assistant"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600">
              Highest degree / current degree
            </label>
            <select
              name="degree"
              defaultValue={profile?.degree || ""}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
            >
              <option value="">Select degree</option>
              <option value="Bachelor">Bachelor</option>
              <option value="Master">Master</option>
              <option value="PhD">PhD</option>
              <option value="Postdoctoral">Postdoctoral</option>
              <option value="Professional Certificate">Professional Certificate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600">
              Country *
            </label>
            <input
              name="country"
              defaultValue={profile?.country || ""}
              placeholder="e.g. Pakistan, China, Mongolia"
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600">
              City
            </label>
            <input
              name="city"
              defaultValue={profile?.city || ""}
              placeholder="e.g. Shanghai"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600">
              Phone / WhatsApp
            </label>
            <input
              name="phone"
              defaultValue={profile?.phone || ""}
              placeholder="+86..."
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-black text-slate-600">
            Research interests
          </label>
          <textarea
            name="research_interest"
            defaultValue={profile?.research_interest || ""}
            rows={4}
            placeholder="e.g. corpus linguistics, NLP, translation studies, academic writing, discourse analysis"
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-sm font-black text-slate-600">
            Short bio
          </label>
          <textarea
            name="bio"
            defaultValue={profile?.bio || ""}
            rows={5}
            placeholder="Write a short academic or professional profile."
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
          />
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-blue-700 px-7 py-4 text-base font-black text-white hover:bg-blue-800"
        >
          Save Profile
        </button>
      </form>
    </main>
  );
}
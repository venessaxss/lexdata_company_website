import { requireAdminOrManager } from "@/lib/auth";
import Link from "next/link";

import { unstable_noStore as noStore } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ManagerMemberProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; completed?: string }>;
}) {
  noStore();

  await requireAdminOrManager();

  const sp = await searchParams;
  const q = String(sp.q || "").trim();
  const completed = String(sp.completed || "all");

  const admin = createAdminClient();

  let query = admin
    .from("profiles")
    .select(
      `
      id,
      email,
      full_name,
      role,
      institution,
      affiliation,
      affiliation_status,
      profession_status,
      profession_title,
      department,
      degree,
      country,
      city,
      phone,
      research_interest,
      bio,
      profile_completed,
      updated_at
    `
    )
    .order("updated_at", { ascending: false });

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,institution.ilike.%${q}%,country.ilike.%${q}%,profession_status.ilike.%${q}%`
    );
  }

  if (completed === "yes") {
    query = query.eq("profile_completed", true);
  }

  if (completed === "no") {
    query = query.or("profile_completed.eq.false,profile_completed.is.null");
  }

  const { data: profiles, error } = await query;

  if (error) {
    throw new Error(`Could not load member profiles: ${error.message}`);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-700">
            Manager
          </p>

          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Member Profiles
          </h1>

          <p className="mt-2 text-slate-600">
            View members?institutions, professions, countries, academic
            backgrounds, and research interests.
          </p>
        </div>

        <Link
          href="/manager"
          className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
        >
          Back to manager dashboard
        </Link>
      </div>

      <form className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, institution, country, profession..."
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
          />

          <select
            name="completed"
            defaultValue={completed}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
          >
            <option value="all">All profiles</option>
            <option value="yes">Completed only</option>
            <option value="no">Incomplete only</option>
          </select>

          <button
            type="submit"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            Search
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[75vh] overflow-auto">
          <table className="w-full min-w-[1300px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Institution</th>
                <th className="px-4 py-3">Profession</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Degree</th>
                <th className="px-4 py-3">Research interests</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>

            <tbody>
              {(profiles ?? []).map((profile: any) => (
                <tr key={profile.id} className="border-t border-slate-100">
                  <td className="px-4 py-4 align-top">
                    <p className="font-black text-slate-950">
                      {profile.full_name || "Unnamed"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {profile.email || "-"}
                    </p>
                    <p className="mt-1 text-xs font-bold text-blue-700">
                      {profile.role || "member"}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <p className="font-bold text-slate-700">
                      {profile.institution || "-"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {profile.department || profile.affiliation || ""}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <p className="font-bold text-slate-700">
                      {profile.profession_status || "-"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {profile.profession_title || ""}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <p className="font-bold text-slate-700">
                      {profile.country || "-"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {profile.city || ""}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-top">
                    {profile.degree || "-"}
                  </td>

                  <td className="px-4 py-4 align-top">
                    <p className="max-w-[320px] whitespace-pre-line text-xs leading-5 text-slate-600">
                      {profile.research_interest || "-"}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-top">
                    {profile.profile_completed ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        Completed
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                        Incomplete
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 align-top text-xs text-slate-500">
                    {profile.updated_at
                      ? new Date(profile.updated_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!profiles || profiles.length === 0) ? (
            <div className="p-8 text-center font-bold text-slate-400">
              No member profiles found.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
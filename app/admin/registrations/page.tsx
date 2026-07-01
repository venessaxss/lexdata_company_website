import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Registration = {
  id: string;
  workshop_id?: string | null;
  workshop_slug?: string | null;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  organization?: string | null;
  message?: string | null;
  status?: string | null;
  created_at?: string | null;
  workshops?: {
    title?: string | null;
    slug?: string | null;
    level?: string | null;
    start_date?: string | null;
    date?: string | null;
  } | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default async function AdminWorkshopRegistrationsPage() {
  noStore();
  await requireAdmin();

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("workshop_registrations")
    .select(
      `
      *,
      workshops (
        title,
        slug,
        level,
        start_date,
        date
      )
    `
    )
    .order("created_at", { ascending: false });

  const registrations = (data ?? []) as Registration[];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/admin"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to admin dashboard
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Admin Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Workshop Registration Records
        </h1>

        <p className="mt-4 max-w-2xl text-slate-600">
          View all registration submissions from public workshop pages.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {registrations.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="text-xl font-black text-slate-950">
              No registrations yet
            </h2>
            <p className="mt-2 text-slate-600">
              New workshop registrations will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Workshop</th>
                  <th className="px-4 py-3">Registrant</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {registrations.map((item) => {
                  const workshopTitle =
                    item.workshops?.title ||
                    item.workshop_slug ||
                    "Unknown workshop";

                  const workshopSlug =
                    item.workshops?.slug || item.workshop_slug;

                  return (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-950">
                          {workshopTitle}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {item.workshops?.level || "-"} ·{" "}
                          {item.workshops?.start_date ||
                            item.workshops?.date ||
                            "TBA"}
                        </div>

                        {workshopSlug ? (
                          <Link
                            href={`/workshops/${workshopSlug}`}
                            className="mt-2 inline-flex text-xs font-bold text-blue-700 hover:underline"
                          >
                            Open workshop
                          </Link>
                        ) : null}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-950">
                          {item.full_name}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        <div>{item.email}</div>
                        {item.phone ? (
                          <div className="mt-1 text-xs">{item.phone}</div>
                        ) : null}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {item.organization || "-"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        <div className="max-w-xs whitespace-pre-wrap">
                          {item.message || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                          {item.status || "pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateWorkshopRegistration } from "./actions";

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
  payment_status?: string | null;
  payment_link?: string | null;
  admin_note?: string | null;
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

export default async function AdminWorkshopRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();
  await requireAdmin();

  const { message } = await searchParams;

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
          View registrations, add payment links, confirm payment, and unlock
          session links for paid participants.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      <section className="grid gap-5">
        {registrations.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              No registrations yet
            </h2>
            <p className="mt-2 text-slate-600">
              New workshop registrations will appear here.
            </p>
          </div>
        ) : (
          registrations.map((item) => {
            const workshopTitle =
              item.workshops?.title ||
              item.workshop_slug ||
              "Unknown workshop";

            const workshopSlug = item.workshops?.slug || item.workshop_slug;

            return (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {formatDate(item.created_at)}
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      {workshopTitle}
                    </h2>

                    <div className="mt-2 text-sm text-slate-500">
                      {item.workshops?.level || "-"} ·{" "}
                      {item.workshops?.start_date ||
                        item.workshops?.date ||
                        "TBA"}
                    </div>

                    {workshopSlug ? (
                      <Link
                        href={`/workshops/${workshopSlug}`}
                        className="mt-3 inline-flex text-sm font-bold text-blue-700 hover:underline"
                      >
                        Open workshop page
                      </Link>
                    ) : null}

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                          Registrant
                        </p>
                        <p className="mt-2 font-bold text-slate-950">
                          {item.full_name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.email}
                        </p>
                        {item.phone ? (
                          <p className="mt-1 text-sm text-slate-600">
                            {item.phone}
                          </p>
                        ) : null}
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                          Organization
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {item.organization || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                        Message
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {item.message || "-"}
                      </p>
                    </div>
                  </div>

                  <form
                    action={updateWorkshopRegistration}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      type="hidden"
                      name="return_to"
                      value="/admin/registrations"
                    />

                    <h3 className="text-lg font-black text-slate-950">
                      Update Registration
                    </h3>

                    <div className="mt-4 grid gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Registration status
                        </label>
                        <select
                          name="status"
                          defaultValue={item.status ?? "registered"}
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          <option value="registered">Registered</option>
                          <option value="approved">Approved</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Payment status
                        </label>
                        <select
                          name="payment_status"
                          defaultValue={item.payment_status ?? "pending"}
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          <option value="pending">Payment pending</option>
                          <option value="sent">Payment link sent</option>
                          <option value="confirmed">Payment confirmed</option>
                          <option value="failed">Payment failed</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Payment link
                        </label>
                        <input
                          name="payment_link"
                          defaultValue={item.payment_link ?? ""}
                          placeholder="Paste payment link"
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Admin note
                        </label>
                        <textarea
                          name="admin_note"
                          defaultValue={item.admin_note ?? ""}
                          rows={4}
                          placeholder="Internal note"
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        />
                      </div>

                      <button
                        type="submit"
                        className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700"
                      >
                        Update registration
                      </button>
                    </div>
                  </form>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
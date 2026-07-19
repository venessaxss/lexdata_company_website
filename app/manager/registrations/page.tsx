import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireManagerOrAdmin } from "@/lib/auth";
import {
  confirmRegistrationAction,
  rejectRegistrationAction,
  reviewRegistrationAction,
  sendRegistrationMessageAction,
} from "@/app/admin/registrations/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 10;

type SearchParams = {
  page?: string;
  status?: string;
  payment?: string;
  q?: string;
  message?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function badge(status?: string | null) {
  const value = String(status || "pending").toLowerCase();
  if (value.includes("confirm") || value.includes("approved") || value.includes("paid")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (value.includes("reject") || value.includes("failed")) {
    return "bg-red-50 text-red-700 border-red-100";
  }
  if (value.includes("review")) {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function makeHref(page: number, params: SearchParams) {
  const next = new URLSearchParams();
  next.set("page", String(page));
  if (params.status) next.set("status", params.status);
  if (params.payment) next.set("payment", params.payment);
  if (params.q) next.set("q", params.q);
  return `/manager/registrations?${next.toString()}`;
}

export default async function ManagerRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  noStore();
  const params = await searchParams;
  const auth = await requireManagerOrAdmin("/manager/registrations");
  const page = Math.max(1, Number(params.page || "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const q = String(params.q || "").trim();

  let query = auth.admin
    .from("workshop_registrations")
    .select("*, workshops(title, slug)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.status && params.status !== "all") {
    query = query.eq("registration_status", params.status);
  }

  if (params.payment && params.payment !== "all") {
    query = query.eq("payment_status", params.payment);
  }

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,manager_note.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  const registrations = data ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <Link href="/manager" className="text-sm font-bold text-blue-200">-&gt; Back to manager dashboard</Link>
              <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-blue-300">Registration command center</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">Review, confirm, reject, and message registrants</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                One login gives you access to every registration step. No second login, no duplicate redirects.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 text-right">
              <p className="text-3xl font-black">{count ?? 0}</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">matching records</p>
            </div>
          </div>
        </div>

        <form className="mt-6 grid gap-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_180px_180px_auto]">
          <input name="q" defaultValue={q} placeholder="Search name, email, note..." className="rounded-xl border border-slate-300 px-4 py-3" />
          <select name="status" defaultValue={params.status || "all"} className="rounded-xl border border-slate-300 px-4 py-3">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select name="payment" defaultValue={params.payment || "all"} className="rounded-xl border border-slate-300 px-4 py-3">
            <option value="all">All payments</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
          </select>
          <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Filter</button>
        </form>

        {params.message ? (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">{params.message}</div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error.message}</div>
        ) : null}

        <div className="mt-8 grid gap-5">
          {registrations.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">No registrations found</h2>
              <p className="mt-2 text-slate-600">Try another search or status filter.</p>
            </div>
          ) : null}

          {registrations.map((r: any) => (
            <article key={r.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-950">{r.full_name || r.name || r.email || "Registrant"}</h2>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${badge(r.registration_status)}`}>{r.registration_status || "pending"}</span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${badge(r.payment_status)}`}>{r.payment_status || "pending"}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{r.email || "No email"} {r.phone ? ` / ${r.phone}` : ""}</p>
                  <p className="mt-3 font-bold text-slate-800">{r.workshops?.title || r.workshop_title || "Unknown workshop"}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Submitted: {formatDate(r.created_at)}</p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    {r.institution ? <p><b>Institution:</b> {r.institution}</p> : null}
                    {r.country ? <p><b>Country:</b> {r.country}</p> : null}
                    {r.profession ? <p><b>Profession:</b> {r.profession}</p> : null}
                    {r.receipt_url ? <p><a href={r.receipt_url} target="_blank" className="font-black text-blue-700">View receipt -&gt;</a></p> : null}
                  </div>
                  {r.manager_note ? <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700"><b>Manager note:</b> {r.manager_note}</p> : null}
                </div>

                <div className="grid gap-4">
                  <form action={reviewRegistrationAction} className="rounded-2xl bg-slate-50 p-4">
                    <input type="hidden" name="id" value={r.id} />
                    <label className="block text-sm font-black text-slate-700">Review note</label>
                    <textarea name="manager_note" rows={3} defaultValue={r.manager_note || ""} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Add internal review note..." />
                    <button className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800">Save review</button>
                  </form>

                  <div className="grid gap-3 md:grid-cols-2">
                    <form action={confirmRegistrationAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="manager_note" value={r.manager_note || ""} />
                      <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Confirm</button>
                    </form>
                    <form action={rejectRegistrationAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="manager_note" value={r.manager_note || ""} />
                      <button className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white">Reject</button>
                    </form>
                  </div>

                  <form action={sendRegistrationMessageAction} className="rounded-2xl bg-blue-50 p-4">
                    <input type="hidden" name="id" value={r.id} />
                    <label className="block text-sm font-black text-blue-900">Message registrant</label>
                    <input name="title" placeholder="Message title" defaultValue="LexData registration update" className="mt-2 w-full rounded-xl border border-blue-100 px-4 py-3" />
                    <textarea name="body" required rows={3} className="mt-2 w-full rounded-xl border border-blue-100 px-4 py-3" placeholder="Write a message or reply..." />
                    <button className="mt-3 rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white">Send message</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <span className="text-sm font-bold text-slate-600">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Link href={makeHref(Math.max(1, page - 1), params)} className={`rounded-xl px-4 py-2 text-sm font-black ${page <= 1 ? "pointer-events-none bg-slate-100 text-slate-400" : "bg-slate-950 text-white"}`}>Previous</Link>
            <Link href={makeHref(Math.min(totalPages, page + 1), params)} className={`rounded-xl px-4 py-2 text-sm font-black ${page >= totalPages ? "pointer-events-none bg-slate-100 text-slate-400" : "bg-slate-950 text-white"}`}>Next</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

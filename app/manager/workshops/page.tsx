import { requireManagerOrAdmin } from "@/lib/auth";
import Link from "next/link";

import { unstable_noStore as noStore } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { updateWorkshopStatusByManager } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Workshop = {
  id: string;
  title?: string | null;
  slug?: string | null;
  recruitment_status?: string | null;
  process_status?: string | null;
  status_note?: string | null;
  internal_status_note?: string | null;
  status_updated_at?: string | null;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function labelStatus(value?: string | null) {
  if (!value) return "-";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function ManagerWorkshopsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();

  await requireManagerOrAdmin();

  const { message } = await searchParams;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("workshops")
    .select(
      "id, title, slug, recruitment_status, process_status, status_note, internal_status_note, status_updated_at, created_at"
    )
    .order("created_at", { ascending: false });

  const workshops = (data ?? []) as Workshop[];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <Link
          href="/manager"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          -&gt;Back to manager dashboard
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Manager Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Workshop Status Control
        </h1>

        <p className="mt-4 max-w-3xl text-slate-600">
          Control recruitment status and workshop progress status. Use this page
          to open recruitment, close recruitment, mark workshops as in progress,
          completed, or terminated.
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

      {workshops.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            No workshops found
          </h2>
        </div>
      ) : (
        <div className="space-y-6">
          {workshops.map((workshop) => (
            <article
              key={workshop.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Workshop
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {workshop.title || "Workshop"}
                  </h2>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p>
                      <span className="font-semibold text-slate-800">
                        Recruitment:
                      </span>{" "}
                      {labelStatus(workshop.recruitment_status || "open")}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Process:
                      </span>{" "}
                      {labelStatus(workshop.process_status || "not_started")}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Updated:
                      </span>{" "}
                      {formatDate(workshop.status_updated_at)}
                    </p>
                  </div>

                  {workshop.status_note ? (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      <p className="font-bold text-slate-800">
                        Public status note
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {workshop.status_note}
                      </p>
                    </div>
                  ) : null}

                  {workshop.internal_status_note ? (
                    <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                      <p className="font-bold">Internal status note</p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {workshop.internal_status_note}
                      </p>
                    </div>
                  ) : null}

                  {workshop.slug ? (
                    <Link
                      href={`/workshops/${workshop.slug}`}
                      className="mt-5 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Open public workshop page
                    </Link>
                  ) : null}
                </div>

                <form
                  action={updateWorkshopStatusByManager}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <input type="hidden" name="id" value={workshop.id} />

                  <h3 className="text-lg font-black text-slate-950">
                    Status Control
                  </h3>

                  <div className="mt-4 grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Recruitment status
                      </label>
                      <select
                        name="recruitment_status"
                        defaultValue={workshop.recruitment_status || "open"}
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >
                        <option value="draft">Draft / hidden</option>
                        <option value="open">Open for recruitment</option>
                        <option value="closed">Recruitment closed</option>
                        <option value="terminated">
                          Recruitment terminated
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Process status
                      </label>
                      <select
                        name="process_status"
                        defaultValue={workshop.process_status || "not_started"}
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >
                        <option value="not_started">Not started</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Public status note
                      </label>
                      <textarea
                        name="status_note"
                        rows={3}
                        defaultValue={workshop.status_note || ""}
                        placeholder="Shown on the public workshop page."
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Internal status note
                      </label>
                      <textarea
                        name="internal_status_note"
                        rows={3}
                        defaultValue={workshop.internal_status_note || ""}
                        placeholder="Only for admin/manager reference."
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />
                    </div>

                    <button
                      type="submit"
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                    >
                      Save status
                    </button>
                  </div>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
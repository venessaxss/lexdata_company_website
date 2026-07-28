import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createWorkshop } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{
  message?: string;
  error?: string;
}>;

type Workshop = {
  id: string;
  title?: string | null;
  slug?: string | null;
  short_description?: string | null;
  start_date?: string | null;
  date?: string | null;
  end_date?: string | null;
  location?: string | null;
  format?: string | null;
  is_published?: boolean | null;
  is_active?: boolean | null;
  recruitment_status?: string | null;
  process_status?: string | null;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Date not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function label(value?: string | null) {
  if (!value) return "Not set";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function AdminWorkshopsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  noStore();
  await requireAdmin();

  const params = searchParams ? await searchParams : {};
  const supabase = createAdminClient();

  const [
    { data: workshopRows, error: workshopsError },
    { data: sessionRows },
    { data: subsessionRows },
  ] = await Promise.all([
    supabase
      .from("workshops")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("workshop_sessions").select("id, workshop_id"),
    supabase.from("workshop_subsessions").select("id, session_id"),
  ]);

  const workshops = (workshopRows || []) as Workshop[];
  const sessions = sessionRows || [];
  const subsessions = subsessionRows || [];

  const sessionsByWorkshop = new Map<string, string[]>();

  for (const session of sessions) {
    if (!session.workshop_id) continue;
    const current = sessionsByWorkshop.get(session.workshop_id) || [];
    current.push(session.id);
    sessionsByWorkshop.set(session.workshop_id, current);
  }

  const subsessionCountBySession = new Map<string, number>();

  for (const subsession of subsessions) {
    if (!subsession.session_id) continue;
    subsessionCountBySession.set(
      subsession.session_id,
      (subsessionCountBySession.get(subsession.session_id) || 0) + 1
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <Link
                href="/admin"
                className="text-sm font-bold text-slate-500 hover:text-slate-950"
              >
                Back to admin dashboard
              </Link>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-indigo-600">
                Workshop library
              </p>

              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                Manage workshops one by one
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This page is only the workshop index. Open one workshop to
                manage its overview, sessions, subsessions, times, links, and
                arrangement on a dedicated page.
              </p>
            </div>

            <details className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:w-[420px]">
              <summary className="cursor-pointer list-none font-black text-slate-950">
                Create a new workshop
              </summary>

              <form action={createWorkshop} className="mt-5 grid gap-3">
                <input
                  name="title"
                  required
                  placeholder="Workshop title"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                />

                <input
                  name="slug"
                  placeholder="workshop-url-slug"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                />

                <textarea
                  name="short_description"
                  rows={3}
                  placeholder="Short description"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    name="start_date"
                    type="date"
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                  />

                  <input
                    name="location"
                    placeholder="Location or Online"
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">
                  <input name="is_published" type="checkbox" />
                  Publish immediately
                </label>

                <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
                  Create workshop
                </button>
              </form>
            </details>
          </div>
        </header>

        {params.message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
            {params.message}
          </div>
        ) : null}

        {params.error || workshopsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {params.error || workshopsError?.message}
          </div>
        ) : null}

        {workshops.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-2xl font-black text-slate-950">
              No workshops yet
            </h2>
            <p className="mt-2 text-slate-500">
              Create the first workshop from the panel above.
            </p>
          </section>
        ) : (
          <section className="grid gap-5 lg:grid-cols-2">
            {workshops.map((workshop) => {
              const sessionIds = sessionsByWorkshop.get(workshop.id) || [];
              const subsessionCount = sessionIds.reduce(
                (total, sessionId) =>
                  total + (subsessionCountBySession.get(sessionId) || 0),
                0
              );

              const published =
                workshop.is_published === true || workshop.is_active === true;

              return (
                <article
                  key={workshop.id}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            published
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {published ? "Published" : "Draft"}
                        </span>

                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                          {label(workshop.process_status || "not_started")}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-black text-slate-950">
                        {workshop.title || "Untitled workshop"}
                      </h2>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {workshop.short_description ||
                          "No workshop description has been added."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs font-black uppercase text-slate-400">
                        Date
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-800">
                        {formatDate(workshop.start_date || workshop.date)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs font-black uppercase text-slate-400">
                        Sessions
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-950">
                        {sessionIds.length}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs font-black uppercase text-slate-400">
                        Subsessions
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-950">
                        {subsessionCount}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs font-black uppercase text-slate-400">
                        Recruitment
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-800">
                        {label(workshop.recruitment_status || "open")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/workshops/${workshop.id}`}
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
                    >
                      Manage this workshop
                    </Link>

                    {workshop.slug ? (
                      <Link
                        href={`/workshops/${workshop.slug}`}
                        className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                      >
                        Public page
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

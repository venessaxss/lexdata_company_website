import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type WorkshopRow = Record<string, any>;
type SessionRow = {
  id?: string | null;
  workshop_id?: string | null;
};
type SubsessionRow = {
  id?: string | null;
  session_id?: string | null;
};

function firstText(
  row: WorkshopRow,
  keys: string[],
  fallback = ""
) {
  for (const key of keys) {
    const value = row?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function firstValue(
  row: WorkshopRow,
  keys: string[]
) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) {
      return row[key];
    }
  }

  return null;
}

function formatDate(value: unknown) {
  if (!value) return "Date not set";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isPublished(row: WorkshopRow) {
  const explicit = firstValue(row, [
    "is_published",
    "published",
  ]);

  if (typeof explicit === "boolean") {
    return explicit;
  }

  const status = firstText(row, [
    "publication_status",
    "status",
  ]).toLowerCase();

  return status === "published" || status === "active";
}

function processLabel(row: WorkshopRow) {
  const status = firstText(
    row,
    [
      "process_status",
      "progress_status",
      "workshop_status",
    ],
    "Not started"
  );

  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function recruitmentLabel(row: WorkshopRow) {
  const status = firstText(
    row,
    [
      "recruitment_status",
      "registration_status",
    ],
    "Open"
  );

  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compactDescription(row: WorkshopRow) {
  return firstText(
    row,
    [
      "short_description",
      "summary",
      "excerpt",
      "description",
    ],
    "No workshop description has been added yet."
  );
}

function updatedTimestamp(row: WorkshopRow) {
  const value = firstValue(row, [
    "updated_at",
    "created_at",
    "start_date",
  ]);

  const time = value ? new Date(String(value)).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

export default async function AdminWorkshopsPage() {
  noStore();

  const actor = await requireAdmin();

  const [
    workshopsResult,
    sessionsResult,
    subsessionsResult,
  ] = await Promise.all([
    actor.admin.from("workshops").select("*"),
    actor.admin
      .from("workshop_sessions")
      .select("id, workshop_id"),
    actor.admin
      .from("workshop_subsessions")
      .select("id, session_id"),
  ]);

  const workshops = (
    (workshopsResult.data || []) as WorkshopRow[]
  ).sort(
    (a, b) => updatedTimestamp(b) - updatedTimestamp(a)
  );

  const sessions =
    (sessionsResult.data || []) as SessionRow[];

  const subsessions =
    (subsessionsResult.data || []) as SubsessionRow[];

  const sessionsByWorkshop = new Map<string, SessionRow[]>();

  for (const session of sessions) {
    const workshopId = String(session.workshop_id || "");

    if (!workshopId) continue;

    const current = sessionsByWorkshop.get(workshopId) || [];
    current.push(session);
    sessionsByWorkshop.set(workshopId, current);
  }

  const subsessionsBySession = new Map<string, number>();

  for (const subsession of subsessions) {
    const sessionId = String(subsession.session_id || "");

    if (!sessionId) continue;

    subsessionsBySession.set(
      sessionId,
      (subsessionsBySession.get(sessionId) || 0) + 1
    );
  }

  const publishedCount = workshops.filter(isPublished).length;
  const draftCount = workshops.length - publishedCount;

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1380px]">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-950"
        >
          <span aria-hidden="true">鈫?/span>
          Back to admin dashboard
        </Link>

        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                Workshop library
              </p>

              <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Manage workshops
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Choose one workshop to manage its overview, sessions,
                subsessions, schedule, links, and arrangement on a dedicated
                page.
              </p>
            </div>

            <Link
              href="/admin/workshops/new"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Create workshop
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Total
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {workshops.length}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Published
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-950">
                {publishedCount}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">
                Draft
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {draftCount}
              </p>
            </div>
          </div>
        </section>

        {workshopsResult.error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {workshopsResult.error.message}
          </div>
        ) : null}

        {workshops.length === 0 ? (
          <section className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-black text-slate-950">
              No workshops yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Create your first workshop to start building its schedule.
            </p>
          </section>
        ) : (
          <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            {workshops.map((workshop) => {
              const id = String(workshop.id || "");
              const slug = firstText(workshop, ["slug"]);
              const title = firstText(
                workshop,
                ["title", "name"],
                "Untitled workshop"
              );

              const workshopSessions =
                sessionsByWorkshop.get(id) || [];

              const subsessionCount = workshopSessions.reduce(
                (total, session) =>
                  total +
                  (subsessionsBySession.get(
                    String(session.id || "")
                  ) || 0),
                0
              );

              const published = isPublished(workshop);
              const startDate = firstValue(workshop, [
                "start_date",
                "start_at",
                "scheduled_start",
                "date",
              ]);

              return (
                <article
                  key={id}
                  className="flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex-1 p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          published
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {published ? "Published" : "Draft"}
                      </span>

                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                        {processLabel(workshop)}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950">
                      {title}
                    </h2>

                    <p
                      className="mt-3 min-h-[3rem] overflow-hidden text-sm leading-6 text-slate-600"
                      style={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                      }}
                    >
                      {compactDescription(workshop)}
                    </p>

                    <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Date
                        </dt>
                        <dd className="mt-1 truncate text-sm font-black text-slate-900">
                          {formatDate(startDate)}
                        </dd>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Sessions
                        </dt>
                        <dd className="mt-1 text-lg font-black text-slate-950">
                          {workshopSessions.length}
                        </dd>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Subsessions
                        </dt>
                        <dd className="mt-1 text-lg font-black text-slate-950">
                          {subsessionCount}
                        </dd>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Recruitment
                        </dt>
                        <dd className="mt-1 truncate text-sm font-black text-slate-900">
                          {recruitmentLabel(workshop)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                    <Link
                      href={`/admin/workshops/${id}`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 sm:flex-none"
                    >
                      Manage workshop
                    </Link>

                    {slug ? (
                      <Link
                        href={`/workshops/${slug}`}
                        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-800 transition hover:bg-slate-100 sm:flex-none"
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
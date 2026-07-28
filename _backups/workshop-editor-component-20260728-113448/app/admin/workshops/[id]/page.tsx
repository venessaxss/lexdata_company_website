import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createSessionAction,
  createSubsessionAction,
  deleteSessionAction,
  deleteSubsessionAction,
  moveSessionAction,
  moveSubsessionAction,
  updateSessionAction,
  updateSubsessionAction,
  updateWorkshopOverviewAction,
  updateWorkshopStatusAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageParams = Promise<{ id: string }>;
type SearchParams = Promise<{ message?: string; error?: string }>;

type Workshop = Record<string, any> & { id: string };
type Session = Record<string, any> & { id: string; workshop_id: string };
type Subsession = Record<string, any> & { id: string; session_id: string };

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500";

function dateValue(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function timeValue(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function formatDate(value?: string | null) {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function timeRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "Time not set";
  if (start && end) return `${timeValue(start)} - ${timeValue(end)}`;
  return timeValue(start || end);
}

function statusLabel(value?: string | null) {
  if (!value) return "Not set";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ExternalLink({ href, label }: { href?: string | null; label: string }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
    >
      {label}
    </a>
  );
}

export default async function WorkshopWorkspacePage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams?: SearchParams;
}) {
  noStore();
  await requireAdmin();

  const { id } = await params;
  const feedback = searchParams ? await searchParams : {};
  const supabase = createAdminClient();

  const { data: workshopRow, error: workshopError } = await supabase
    .from("workshops")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (workshopError || !workshopRow) {
    notFound();
  }

  const workshop = workshopRow as Workshop;

  const { data: sessionRows, error: sessionsError } = await supabase
    .from("workshop_sessions")
    .select("*")
    .eq("workshop_id", id)
    .order("display_order", { ascending: true })
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })
    .order("created_at", { ascending: true });

  const sessions = (sessionRows || []) as Session[];
  let subsessions: Subsession[] = [];
  let subsessionsError: { message: string } | null = null;

  if (sessions.length > 0) {
    const result = await supabase
      .from("workshop_subsessions")
      .select("*")
      .in(
        "session_id",
        sessions.map((session) => session.id)
      )
      .order("display_order", { ascending: true })
      .order("start_time", { ascending: true })
      .order("created_at", { ascending: true });

    subsessions = (result.data || []) as Subsession[];
    subsessionsError = result.error;
  }

  const subsessionsBySession = new Map<string, Subsession[]>();

  for (const subsession of subsessions) {
    const current = subsessionsBySession.get(subsession.session_id) || [];
    current.push(subsession);
    subsessionsBySession.set(subsession.session_id, current);
  }

  const missingMeetingLinks = sessions.filter(
    (session) => !session.meeting_url
  ).length;
  const totalSubsessions = subsessions.length;
  const published =
    workshop.is_published === true || workshop.is_active === true;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <Link
                href="/admin/workshops"
                className="text-sm font-black text-slate-500 hover:text-slate-950"
              >
                Back to workshop library
              </Link>

              <div className="mt-5 flex flex-wrap gap-2">
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
                  {statusLabel(workshop.process_status || "not_started")}
                </span>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                  Recruitment {statusLabel(workshop.recruitment_status || "open")}
                </span>
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                {workshop.title || "Workshop"}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                One workshop workspace for the overview, major sessions,
                subsessions, times, access links, materials, and arrangement.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {workshop.slug ? (
                <>
                  <Link
                    href={`/workshops/${workshop.slug}`}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700"
                  >
                    Public page
                  </Link>

                  <Link
                    href={`/workshops/${workshop.slug}/live`}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700"
                  >
                    Live room
                  </Link>
                </>
              ) : null}

              <Link
                href={`/manager/registrations?workshop=${workshop.id}`}
                className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
              >
                Registrations
              </Link>
            </div>
          </div>
        </header>

        {feedback.message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
            {feedback.message}
          </div>
        ) : null}

        {feedback.error || sessionsError || subsessionsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {feedback.error || sessionsError?.message || subsessionsError?.message}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Major sessions
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {sessions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Subsessions
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {totalSubsessions}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Missing meeting links
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {missingMeetingLinks}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Workshop date
            </p>
            <p className="mt-2 text-sm font-black text-slate-950">
              {formatDate(workshop.start_date || workshop.date)}
            </p>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <section id="overview" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <details>
                <summary className="cursor-pointer list-none text-lg font-black text-slate-950">
                  Workshop overview
                </summary>

                <form action={updateWorkshopOverviewAction} className="mt-5 grid gap-3">
                  <input type="hidden" name="workshop_id" value={workshop.id} />

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Title
                    <input name="title" required defaultValue={workshop.title || ""} className={inputClass} />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Slug
                    <input name="slug" defaultValue={workshop.slug || ""} className={inputClass} />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Short description
                    <textarea name="short_description" rows={3} defaultValue={workshop.short_description || workshop.summary || ""} className={inputClass} />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Full description
                    <textarea name="description" rows={5} defaultValue={workshop.description || workshop.intro || ""} className={inputClass} />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Start date
                      <input name="start_date" type="date" defaultValue={dateValue(workshop.start_date || workshop.date)} className={inputClass} />
                    </label>

                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      End date
                      <input name="end_date" type="date" defaultValue={dateValue(workshop.end_date)} className={inputClass} />
                    </label>
                  </div>

                  <input name="speaker" placeholder="Speaker" defaultValue={workshop.instructor || workshop.speaker || ""} className={inputClass} />
                  <input name="location" placeholder="Location" defaultValue={workshop.location || ""} className={inputClass} />
                  <input name="format" placeholder="Online / Hybrid / On-site" defaultValue={workshop.format || "Online"} className={inputClass} />

                  <div className="grid grid-cols-2 gap-3">
                    <input name="level" placeholder="Level" defaultValue={workshop.level || "All levels"} className={inputClass} />
                    <input name="language" placeholder="Language" defaultValue={workshop.language || "English"} className={inputClass} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input name="price" type="number" min="0" step="0.01" placeholder="Price" defaultValue={workshop.price ?? 0} className={inputClass} />
                    <input name="currency" placeholder="USD" defaultValue={workshop.currency || "USD"} className={inputClass} />
                  </div>

                  <input name="capacity" type="number" min="0" placeholder="Capacity" defaultValue={workshop.capacity ?? 0} className={inputClass} />
                  <input name="duration" placeholder="Duration" defaultValue={workshop.duration || ""} className={inputClass} />
                  <input name="image_url" type="url" placeholder="Cover image URL" defaultValue={workshop.image_url || workshop.cover_url || ""} className={inputClass} />
                  <input name="material_url" type="url" placeholder="Main workshop material URL" defaultValue={workshop.material_url || workshop.materials_url || ""} className={inputClass} />

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">
                    <input name="is_featured" type="checkbox" defaultChecked={workshop.is_featured === true} />
                    Featured
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">
                    <input name="is_published" type="checkbox" defaultChecked={published} />
                    Published
                  </label>

                  <button className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700">
                    Save overview
                  </button>
                </form>
              </details>
            </section>

            <section id="status" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <details>
                <summary className="cursor-pointer list-none text-lg font-black text-slate-950">
                  Recruitment and process
                </summary>

                <form action={updateWorkshopStatusAction} className="mt-5 grid gap-3">
                  <input type="hidden" name="workshop_id" value={workshop.id} />

                  <select name="recruitment_status" defaultValue={workshop.recruitment_status || "open"} className={inputClass}>
                    <option value="draft">Draft</option>
                    <option value="open">Recruitment open</option>
                    <option value="closed">Recruitment closed</option>
                    <option value="terminated">Recruitment terminated</option>
                  </select>

                  <select name="process_status" defaultValue={workshop.process_status || "not_started"} className={inputClass}>
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="terminated">Terminated</option>
                  </select>

                  <textarea name="status_note" rows={3} placeholder="Public status note" defaultValue={workshop.status_note || ""} className={inputClass} />
                  <textarea name="internal_status_note" rows={3} placeholder="Internal note" defaultValue={workshop.internal_status_note || ""} className={inputClass} />

                  <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                    Save status
                  </button>
                </form>
              </details>
            </section>
          </aside>

          <section id="schedule" className="space-y-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                    Schedule builder
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    Sessions and subsessions
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Use the arrow controls to arrange major sessions and their subsessions.
                  </p>
                </div>

                <details className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:w-[390px]">
                  <summary className="cursor-pointer list-none font-black text-indigo-900">
                    Add major session
                  </summary>

                  <form action={createSessionAction} className="mt-4 grid gap-3">
                    <input type="hidden" name="workshop_id" value={workshop.id} />
                    <input name="title" required placeholder="Session title" className={inputClass} />

                    <div className="grid grid-cols-3 gap-2">
                      <input name="session_date" required type="date" defaultValue={dateValue(workshop.start_date || workshop.date)} className={inputClass} />
                      <input name="start_time" required type="time" className={inputClass} />
                      <input name="end_time" required type="time" className={inputClass} />
                    </div>

                    <input name="location" placeholder="Room or location" className={inputClass} />
                    <input name="meeting_url" type="url" placeholder="Live meeting link" className={inputClass} />
                    <input name="recording_url" type="url" placeholder="Recording link" className={inputClass} />
                    <input name="material_url" type="url" placeholder="Material link" className={inputClass} />

                    <label className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-bold">
                      <input name="is_active" type="checkbox" defaultChecked />
                      Active
                    </label>

                    <button className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white">
                      Add session
                    </button>
                  </form>
                </details>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
                <h3 className="text-xl font-black text-slate-950">
                  No major sessions yet
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Add the first session using the panel above.
                </p>
              </div>
            ) : (
              sessions.map((session, sessionIndex) => {
                const childSessions = subsessionsBySession.get(session.id) || [];

                return (
                  <article key={session.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div className="flex gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
                            {sessionIndex + 1}
                          </div>

                          <div>
                            <div className="flex flex-wrap gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-black ${session.is_active !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                                {session.is_active !== false ? "Active" : "Hidden"}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                                {childSessions.length} subsessions
                              </span>
                            </div>

                            <h3 className="mt-3 text-2xl font-black text-slate-950">
                              {session.title || "Workshop Session"}
                            </h3>

                            <p className="mt-2 text-sm font-bold text-slate-600">
                              {formatDate(session.session_date || session.starts_at)} | {timeRange(session.start_time, session.end_time)}
                              {session.location ? ` | ${session.location}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <form action={moveSessionAction}>
                            <input type="hidden" name="workshop_id" value={workshop.id} />
                            <input type="hidden" name="session_id" value={session.id} />
                            <input type="hidden" name="direction" value="up" />
                            <button disabled={sessionIndex === 0} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-30">
                              Move up
                            </button>
                          </form>

                          <form action={moveSessionAction}>
                            <input type="hidden" name="workshop_id" value={workshop.id} />
                            <input type="hidden" name="session_id" value={session.id} />
                            <input type="hidden" name="direction" value="down" />
                            <button disabled={sessionIndex === sessions.length - 1} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-30">
                              Move down
                            </button>
                          </form>

                          <ExternalLink href={session.meeting_url} label="Open live link" />
                          <ExternalLink href={session.recording_url} label="Recording" />
                          <ExternalLink href={session.material_url} label="Materials" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 p-5">
                      <details className="rounded-2xl border border-slate-200 p-4">
                        <summary className="cursor-pointer list-none font-black text-slate-800">
                          Edit major session
                        </summary>

                        <form action={updateSessionAction} className="mt-4 grid gap-3">
                          <input type="hidden" name="workshop_id" value={workshop.id} />
                          <input type="hidden" name="session_id" value={session.id} />

                          <input name="title" required defaultValue={session.title || ""} className={inputClass} />

                          <div className="grid gap-3 md:grid-cols-3">
                            <input name="session_date" required type="date" defaultValue={dateValue(session.session_date || session.starts_at)} className={inputClass} />
                            <input name="start_time" required type="time" defaultValue={timeValue(session.start_time)} className={inputClass} />
                            <input name="end_time" required type="time" defaultValue={timeValue(session.end_time)} className={inputClass} />
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <input name="location" placeholder="Location" defaultValue={session.location || ""} className={inputClass} />
                            <input name="display_order" type="number" min="0" defaultValue={session.display_order ?? sessionIndex + 1} className={inputClass} />
                          </div>

                          <input name="meeting_url" type="url" placeholder="Live meeting link" defaultValue={session.meeting_url || ""} className={inputClass} />
                          <input name="recording_url" type="url" placeholder="Recording link" defaultValue={session.recording_url || ""} className={inputClass} />
                          <input name="material_url" type="url" placeholder="Material link" defaultValue={session.material_url || ""} className={inputClass} />

                          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">
                            <input name="is_active" type="checkbox" defaultChecked={session.is_active !== false} />
                            Active
                          </label>

                          <div className="flex flex-wrap justify-between gap-3">
                            <button className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white">
                              Save session
                            </button>
                          </div>
                        </form>

                        <form action={deleteSessionAction} className="mt-3">
                          <input type="hidden" name="workshop_id" value={workshop.id} />
                          <input type="hidden" name="session_id" value={session.id} />
                          <button className="rounded-xl border border-red-200 px-4 py-2 text-xs font-black text-red-700 hover:bg-red-50">
                            Delete this session and its subsessions
                          </button>
                        </form>
                      </details>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                              Subsessions
                            </p>
                            <h4 className="mt-1 text-lg font-black text-slate-950">
                              Detailed agenda
                            </h4>
                          </div>

                          <details className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                            <summary className="cursor-pointer list-none text-sm font-black text-indigo-900">
                              Add subsession
                            </summary>

                            <form action={createSubsessionAction} className="mt-4 grid min-w-[280px] gap-3 sm:min-w-[420px]">
                              <input type="hidden" name="workshop_id" value={workshop.id} />
                              <input type="hidden" name="session_id" value={session.id} />

                              <input name="title" required placeholder="Subsession title" className={inputClass} />
                              <textarea name="description" rows={3} placeholder="Description or arrangement notes" className={inputClass} />

                              <div className="grid grid-cols-2 gap-3">
                                <input name="start_time" type="time" className={inputClass} />
                                <input name="end_time" type="time" className={inputClass} />
                              </div>

                              <input name="meeting_url" type="url" placeholder="Separate live link, if needed" className={inputClass} />
                              <input name="recording_url" type="url" placeholder="Recording link" className={inputClass} />
                              <input name="material_url" type="url" placeholder="Material link" className={inputClass} />

                              <label className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-bold">
                                <input name="is_active" type="checkbox" defaultChecked />
                                Active
                              </label>

                              <button className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white">
                                Add subsession
                              </button>
                            </form>
                          </details>
                        </div>

                        {childSessions.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">
                            No subsessions in this major session.
                          </div>
                        ) : (
                          childSessions.map((subsession, subIndex) => (
                            <div key={subsession.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                                <div className="flex gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-slate-700 shadow-sm">
                                    {sessionIndex + 1}.{subIndex + 1}
                                  </div>

                                  <div>
                                    <h5 className="font-black text-slate-950">
                                      {subsession.title || "Subsession"}
                                    </h5>
                                    <p className="mt-1 text-sm font-bold text-slate-500">
                                      {timeRange(subsession.start_time, subsession.end_time)}
                                    </p>
                                    {subsession.description ? (
                                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                        {subsession.description}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <form action={moveSubsessionAction}>
                                    <input type="hidden" name="workshop_id" value={workshop.id} />
                                    <input type="hidden" name="session_id" value={session.id} />
                                    <input type="hidden" name="subsession_id" value={subsession.id} />
                                    <input type="hidden" name="direction" value="up" />
                                    <button disabled={subIndex === 0} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black disabled:opacity-30">
                                      Up
                                    </button>
                                  </form>

                                  <form action={moveSubsessionAction}>
                                    <input type="hidden" name="workshop_id" value={workshop.id} />
                                    <input type="hidden" name="session_id" value={session.id} />
                                    <input type="hidden" name="subsession_id" value={subsession.id} />
                                    <input type="hidden" name="direction" value="down" />
                                    <button disabled={subIndex === childSessions.length - 1} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black disabled:opacity-30">
                                      Down
                                    </button>
                                  </form>

                                  <ExternalLink href={subsession.meeting_url} label="Live link" />
                                  <ExternalLink href={subsession.recording_url} label="Recording" />
                                  <ExternalLink href={subsession.material_url} label="Materials" />
                                </div>
                              </div>

                              <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                                <summary className="cursor-pointer list-none text-sm font-black text-slate-700">
                                  Edit subsession
                                </summary>

                                <form action={updateSubsessionAction} className="mt-4 grid gap-3">
                                  <input type="hidden" name="workshop_id" value={workshop.id} />
                                  <input type="hidden" name="session_id" value={session.id} />
                                  <input type="hidden" name="subsession_id" value={subsession.id} />

                                  <input name="title" required defaultValue={subsession.title || ""} className={inputClass} />
                                  <textarea name="description" rows={3} defaultValue={subsession.description || ""} className={inputClass} />

                                  <div className="grid gap-3 md:grid-cols-3">
                                    <input name="start_time" type="time" defaultValue={timeValue(subsession.start_time)} className={inputClass} />
                                    <input name="end_time" type="time" defaultValue={timeValue(subsession.end_time)} className={inputClass} />
                                    <input name="display_order" type="number" min="0" defaultValue={subsession.display_order ?? subIndex + 1} className={inputClass} />
                                  </div>

                                  <input name="meeting_url" type="url" placeholder="Live link" defaultValue={subsession.meeting_url || ""} className={inputClass} />
                                  <input name="recording_url" type="url" placeholder="Recording link" defaultValue={subsession.recording_url || ""} className={inputClass} />
                                  <input name="material_url" type="url" placeholder="Material link" defaultValue={subsession.material_url || ""} className={inputClass} />

                                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">
                                    <input name="is_active" type="checkbox" defaultChecked={subsession.is_active !== false} />
                                    Active
                                  </label>

                                  <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                                    Save subsession
                                  </button>
                                </form>

                                <form action={deleteSubsessionAction} className="mt-3">
                                  <input type="hidden" name="workshop_id" value={workshop.id} />
                                  <input type="hidden" name="session_id" value={session.id} />
                                  <input type="hidden" name="subsession_id" value={subsession.id} />
                                  <button className="rounded-xl border border-red-200 px-4 py-2 text-xs font-black text-red-700 hover:bg-red-50">
                                    Delete subsession
                                  </button>
                                </form>
                              </details>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

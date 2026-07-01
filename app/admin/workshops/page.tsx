import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createWorkshop,
  createWorkshopSession,
  createWorkshopSubsession,
  deleteWorkshopSession,
  deleteWorkshopSubsession,
} from "./actions";
import SessionMediaUploader from "@/components/SessionMediaUploader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Workshop = {
  id: string;
  title?: string | null;
  slug?: string | null;
  level?: string | null;
  language?: string | null;
  short_description?: string | null;
  summary?: string | null;
  format?: string | null;
  start_date?: string | null;
  date?: string | null;
  duration?: string | null;
  is_published?: boolean | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type WorkshopSession = {
  id: string;
  workshop_id?: string | null;
  title?: string | null;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  starts_at?: string | null;
  location?: string | null;
  meeting_url?: string | null;
  recording_url?: string | null;
  material_url?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
};

type WorkshopSubsession = {
  id: string;
  session_id?: string | null;
  title?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  meeting_url?: string | null;
  recording_url?: string | null;
  material_url?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
};

export default async function AdminWorkshopsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();
  await requireAdmin();

  const { message } = await searchParams;

  const supabase = createAdminClient();

  const { data: workshopsData, error: workshopsError } = await supabase
    .from("workshops")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: sessionsData, error: sessionsError } = await supabase
    .from("workshop_sessions")
    .select("*")
    .order("display_order", { ascending: true })
    .order("starts_at", { ascending: true });

  const { data: subsessionsData, error: subsessionsError } = await supabase
    .from("workshop_subsessions")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const workshops = (workshopsData ?? []) as Workshop[];
  const sessions = (sessionsData ?? []) as WorkshopSession[];
  const subsessions = (subsessionsData ?? []) as WorkshopSubsession[];

  const workshopById = new Map(
    workshops.map((workshop) => [workshop.id, workshop])
  );

  const subsessionsBySessionId = new Map<string, WorkshopSubsession[]>();

  for (const subsession of subsessions) {
    if (!subsession.session_id) continue;

    const existing = subsessionsBySessionId.get(subsession.session_id) ?? [];
    existing.push(subsession);
    subsessionsBySessionId.set(subsession.session_id, existing);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
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
          Workshop Management
        </h1>

        <p className="mt-4 max-w-3xl text-slate-600">
          Create workshops, add major sessions, delete sessions, and add
          subsessions under each major session.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {workshopsError || sessionsError || subsessionsError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {workshopsError?.message ||
            sessionsError?.message ||
            subsessionsError?.message}
        </div>
      ) : null}

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Add New Workshop
        </h2>

        <form action={createWorkshop} className="mt-6 grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <input
              name="title"
              required
              placeholder="Workshop title"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="slug"
              placeholder="workshop-slug"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <select
              name="level"
              defaultValue="Beginner"
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>

            <input
              name="language"
              defaultValue="English"
              className="w-full rounded-xl border px-4 py-3"
            />

            <select
              name="format"
              defaultValue="Online"
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <textarea
            name="short_description"
            rows={3}
            placeholder="Short description"
            className="w-full rounded-xl border px-4 py-3"
          />

          <textarea
            name="description"
            rows={8}
            placeholder="Full workshop introduction"
            className="w-full rounded-xl border px-4 py-3"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <input
              name="instructor"
              placeholder="Instructor / Speaker"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="location"
              placeholder="Location"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <input
              name="start_date"
              type="date"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="end_date"
              type="date"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="duration"
              placeholder="Duration"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <input
              name="price"
              type="number"
              step="0.01"
              defaultValue={0}
              placeholder="Price"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="currency"
              defaultValue="USD"
              placeholder="Currency"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="capacity"
              type="number"
              defaultValue={0}
              placeholder="Capacity"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <input
            name="image_url"
            placeholder="Cover image URL"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="material_url"
            placeholder="Workshop material URL"
            className="w-full rounded-xl border px-4 py-3"
          />

          <div className="flex flex-wrap gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex items-center gap-2">
              <input name="is_featured" type="checkbox" />
              <span>Feature this workshop</span>
            </label>

            <label className="flex items-center gap-2">
              <input name="is_published" type="checkbox" defaultChecked />
              <span>Publish this workshop</span>
            </label>
          </div>

          <button type="submit" className="btn-primary w-fit">
            Create Workshop
          </button>
        </form>
      </section>

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Add Major Session
        </h2>

        <form action={createWorkshopSession} className="mt-6 grid gap-5">
          <select
            name="workshop_id"
            required
            className="w-full rounded-xl border px-4 py-3"
          >
            <option value="">Choose workshop</option>
            {workshops.map((workshop) => (
              <option key={workshop.id} value={workshop.id}>
                {workshop.title}
              </option>
            ))}
          </select>

          <div className="grid gap-5 md:grid-cols-2">
            <input
              name="title"
              placeholder="Major session title"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="session_date"
              type="date"
              required
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <input
              name="start_time"
              type="time"
              required
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="end_time"
              type="time"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="display_order"
              type="number"
              defaultValue={0}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <input
            name="location"
            placeholder="Session location"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="meeting_url"
            placeholder="Meeting / Zoom URL"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="recording_url"
            placeholder="Recording URL"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="material_url"
            placeholder="Session material URL"
            className="w-full rounded-xl border px-4 py-3"
          />

          <SessionMediaUploader />

          <input
            name="external_video_url"
            placeholder="YouTube / Jianying / external video link"
            className="w-full rounded-xl border px-4 py-3"
          />

          <label className="flex items-center gap-2">
            <input name="is_active" type="checkbox" defaultChecked />
            <span>Show this session</span>
          </label>

          <button type="submit" className="btn-primary w-fit">
            Add Major Session
          </button>
        </form>
      </section>

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Existing Sessions and Subsessions
        </h2>

        {sessions.length === 0 ? (
          <p className="mt-4 text-slate-600">No sessions yet.</p>
        ) : (
          <div className="mt-6 grid gap-6">
            {sessions.map((session) => {
              const workshop = session.workshop_id
                ? workshopById.get(session.workshop_id)
                : null;

              const childSubsessions =
                subsessionsBySessionId.get(session.id) ?? [];

              return (
                <article
                  key={session.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        {workshop?.title || "Unknown workshop"}
                      </p>

                      <h3 className="mt-2 text-xl font-black text-slate-950">
                        {session.title || "Major Session"}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        {session.session_date || "No date"} ·{" "}
                        {session.start_time || "No start time"}-
                        {session.end_time || "No end time"} · Order{" "}
                        {session.display_order ?? 0}
                      </p>
                    </div>

                    <form action={deleteWorkshopSession}>
                      <input type="hidden" name="id" value={session.id} />
                      <button
                        type="submit"
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                      >
                        Delete major session
                      </button>
                    </form>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                    <h4 className="text-lg font-black text-slate-950">
                      Add Subsession under this major session
                    </h4>

                    <form
                      action={createWorkshopSubsession}
                      className="mt-4 grid gap-4"
                    >
                      <input
                        type="hidden"
                        name="session_id"
                        value={session.id}
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <input
                          name="title"
                          placeholder="Subsession title"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                        <input
                          name="display_order"
                          type="number"
                          defaultValue={0}
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </div>

                      <textarea
                        name="description"
                        rows={3}
                        placeholder="Subsession description"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <input
                          name="start_time"
                          type="time"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                        <input
                          name="end_time"
                          type="time"
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </div>

                      <input
                        name="meeting_url"
                        placeholder="Subsession meeting URL"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                      <input
                        name="recording_url"
                        placeholder="Subsession recording URL"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                      <input
                        name="material_url"
                        placeholder="Subsession material URL"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                      <SessionMediaUploader />

                      <input
                        name="external_video_url"
                        placeholder="Subsession YouTube / Jianying / external video link"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                      <label className="flex items-center gap-2">
                        <input name="is_active" type="checkbox" defaultChecked />
                        <span>Show this subsession</span>
                      </label>

                      <button type="submit" className="btn-primary w-fit">
                        Add Subsession
                      </button>
                    </form>
                  </div>

                  {childSubsessions.length > 0 ? (
                    <div className="mt-6 grid gap-3">
                      <h4 className="font-black text-slate-950">
                        Existing Subsessions
                      </h4>

                      {childSubsessions.map((subsession) => (
                        <div
                          key={subsession.id}
                          className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center"
                        >
                          <div>
                            <p className="font-bold text-slate-950">
                              {subsession.title}
                            </p>

                            <p className="text-sm text-slate-600">
                              {subsession.start_time || "No start time"}-
                              {subsession.end_time || "No end time"} · Order{" "}
                              {subsession.display_order ?? 0}
                            </p>

                            {subsession.description ? (
                              <p className="mt-1 text-sm text-slate-500">
                                {subsession.description}
                              </p>
                            ) : null}
                          </div>

                          <form action={deleteWorkshopSubsession}>
                            <input
                              type="hidden"
                              name="id"
                              value={subsession.id}
                            />
                            <button
                              type="submit"
                              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                            >
                              Delete subsession
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Existing Workshops
        </h2>

        {workshops.length === 0 ? (
          <p className="mt-4 text-slate-600">No workshops yet.</p>
        ) : (
          <div className="mt-6 grid gap-5">
            {workshops.map((workshop) => {
              const publicHref = workshop.slug
                ? `/workshops/${workshop.slug}`
                : "/workshops";

              return (
                <article
                  key={workshop.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">
                        {workshop.title}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        {workshop.level || "Beginner"} ·{" "}
                        {workshop.format || "Online"} ·{" "}
                        {workshop.start_date || workshop.date || "TBA"}
                      </p>

                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                        {workshop.short_description ||
                          workshop.summary ||
                          "No short description."}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Status:{" "}
                        {workshop.is_published !== false &&
                        workshop.is_active !== false
                          ? "Published"
                          : "Hidden"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={publicHref}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
                      >
                        View
                      </Link>

                      <Link
                        href={`/admin/workshops/${workshop.id}/edit`}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                      >
                        Edit
                      </Link>

                      <Link
                        href={`/admin/workshops/${workshop.id}/delete`}
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
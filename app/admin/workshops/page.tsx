import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createWorkshop,
  createWorkshopSession,
  createWorkshopSubsession,
  deleteWorkshop,
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
  short_description?: string | null;
  summary?: string | null;
  description?: string | null;
  instructor?: string | null;
  speaker?: string | null;
  level?: string | null;
  language?: string | null;
  format?: string | null;
  location?: string | null;
  start_date?: string | null;
  date?: string | null;
  end_date?: string | null;
  duration?: string | null;
  price?: number | null;
  currency?: string | null;
  capacity?: number | null;
  image_url?: string | null;
  cover_url?: string | null;
  thumbnail_url?: string | null;
  material_url?: string | null;
  materials_url?: string | null;
  resource_url?: string | null;
  file_url?: string | null;
  is_featured?: boolean | null;
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
  ends_at?: string | null;
  location?: string | null;
  meeting_url?: string | null;
  recording_url?: string | null;
  material_url?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
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
  created_at?: string | null;
};

function getWorkshopDescription(workshop: Workshop) {
  return workshop.short_description || workshop.summary || workshop.description || "";
}

function getWorkshopDate(workshop: Workshop) {
  return workshop.start_date || workshop.date || "";
}

function getWorkshopSpeaker(workshop: Workshop) {
  return workshop.instructor || workshop.speaker || "";
}

function getWorkshopImage(workshop: Workshop) {
  return workshop.image_url || workshop.cover_url || workshop.thumbnail_url || "";
}

function getWorkshopMaterial(workshop: Workshop) {
  return (
    workshop.material_url ||
    workshop.materials_url ||
    workshop.resource_url ||
    workshop.file_url ||
    ""
  );
}

function formatPrice(workshop: Workshop) {
  const price = workshop.price ?? 0;
  const currency = workshop.currency || "USD";

  if (!price) {
    return "Free / Not set";
  }

  return `${currency} ${price}`;
}

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
    .order("created_at", { ascending: true });

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

  const sessionsByWorkshopId = new Map<string, WorkshopSession[]>();

  for (const session of sessions) {
    if (!session.workshop_id) continue;

    const existing = sessionsByWorkshopId.get(session.workshop_id) ?? [];
    existing.push(session);
    sessionsByWorkshopId.set(session.workshop_id, existing);
  }

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
          -&gt;Back to admin dashboard
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Admin Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Workshops
        </h1>

        <p className="mt-4 max-w-3xl text-slate-600">
          Create workshops, add major sessions, add subsessions, edit
          subsessions, and manage workshop visibility.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {workshopsError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Workshops error: {workshopsError.message}
        </div>
      ) : null}

      {sessionsError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Sessions error: {sessionsError.message}
        </div>
      ) : null}

      {subsessionsError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Subsessions error: {subsessionsError.message}
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
              placeholder="workshop-url-slug"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <textarea
            name="short_description"
            rows={3}
            placeholder="Short description"
            className="w-full rounded-xl border px-4 py-3"
          />

          <textarea
            name="description"
            rows={5}
            placeholder="Full workshop introduction"
            className="w-full rounded-xl border px-4 py-3"
          />

          <div className="grid gap-5 md:grid-cols-3">
            <input
              name="instructor"
              placeholder="Instructor / Speaker"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="level"
              defaultValue="Beginner"
              placeholder="Level"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="language"
              defaultValue="English"
              placeholder="Language"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <input
              name="format"
              defaultValue="Online"
              placeholder="Online / Offline / Hybrid"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="location"
              placeholder="Location"
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
              name="capacity"
              type="number"
              defaultValue={0}
              placeholder="Capacity"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <input
              name="price"
              type="number"
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
              name="image_url"
              placeholder="Cover image URL"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <input
            name="material_url"
            placeholder="Workshop material URL"
            className="w-full rounded-xl border px-4 py-3"
          />

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input name="is_featured" type="checkbox" />
              <span>Featured workshop</span>
            </label>

            <label className="flex items-center gap-2">
              <input name="is_published" type="checkbox" defaultChecked />
              <span>Published</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-fit rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
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
              required
              placeholder="Major session title"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="display_order"
              type="number"
              defaultValue={0}
              placeholder="Display order"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <input
              name="session_date"
              type="date"
              className="w-full rounded-xl border px-4 py-3"
            />

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
            name="location"
            placeholder="Location"
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
            placeholder="Material URL"
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

          <button
            type="submit"
            className="w-fit rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
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
          <div className="mt-6 space-y-6">
            {sessions.map((session) => {
              const workshop = session.workshop_id
                ? workshopById.get(session.workshop_id)
                : null;

              const childSubsessions =
                subsessionsBySessionId.get(session.id) ?? [];

              return (
                <article
                  key={session.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Major Session 路 Order {session.display_order ?? 0}
                      </p>

                      <h3 className="mt-2 text-2xl font-black text-slate-950">
                        {session.title || "Workshop Session"}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        Workshop: {workshop?.title || "Unknown workshop"}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        Date: {session.session_date || "-"} 路 Time:{" "}
                        {session.start_time || "-"} - {session.end_time || "-"}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        Status:{" "}
                        {session.is_active === false ? "Hidden" : "Visible"}
                      </p>

                      {session.media_url ? (
                        <p className="mt-1 break-all text-sm text-slate-600">
                          Media: {session.media_url}
                        </p>
                      ) : null}
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

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="font-black text-slate-950">
                      Add Subsession
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
                          required
                          placeholder="Subsession title"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                        <input
                          name="display_order"
                          type="number"
                          defaultValue={0}
                          placeholder="Display order"
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
                        placeholder="Material URL"
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
                        <span>Show this subsession</span>
                      </label>

                      <button
                        type="submit"
                        className="w-fit rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                      >
                        Add Subsession
                      </button>
                    </form>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-black text-slate-950">
                      Subsessions
                    </h4>

                    {childSubsessions.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-600">
                        No subsessions yet.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {childSubsessions.map((subsession) => (
                          <div
                            key={subsession.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                  Subsession 路 Order{" "}
                                  {subsession.display_order ?? 0}
                                </p>

                                <h5 className="mt-2 text-lg font-black text-slate-950">
                                  {subsession.title || "Subsession"}
                                </h5>

                                <p className="mt-2 text-sm text-slate-600">
                                  Time: {subsession.start_time || "-"} -{" "}
                                  {subsession.end_time || "-"}
                                </p>

                                <p className="mt-1 text-sm text-slate-600">
                                  Status:{" "}
                                  {subsession.is_active === false
                                    ? "Hidden"
                                    : "Visible"}
                                </p>

                                {subsession.description ? (
                                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                    {subsession.description}
                                  </p>
                                ) : null}

                                {subsession.media_url ? (
                                  <p className="mt-3 break-all text-sm text-slate-500">
                                    Media: {subsession.media_url}
                                  </p>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Link
                                  href={`/admin/workshops/subsessions/${subsession.id}/edit`}
                                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                                >
                                  Edit subsession
                                </Link>

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
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workshops.map((workshop) => {
              const workshopSessions =
                sessionsByWorkshopId.get(workshop.id) ?? [];

              return (
                <article
                  key={workshop.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  {getWorkshopImage(workshop) ? (
                    <img
                      src={getWorkshopImage(workshop)}
                      alt={workshop.title || "Workshop"}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-500">
                      No image
                    </div>
                  )}

                  <div className="p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      {workshop.is_published || workshop.is_active
                        ? "Published"
                        : "Draft"}
                    </p>

                    <h3 className="mt-3 text-xl font-black text-slate-950">
                      {workshop.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      Slug: {workshop.slug || "-"}
                    </p>

                    {getWorkshopDescription(workshop) ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {getWorkshopDescription(workshop)}
                      </p>
                    ) : null}

                    <div className="mt-4 space-y-1 text-sm text-slate-600">
                      <p>Speaker: {getWorkshopSpeaker(workshop) || "-"}</p>
                      <p>Date: {getWorkshopDate(workshop) || "-"}</p>
                      <p>Format: {workshop.format || "-"}</p>
                      <p>Price: {formatPrice(workshop)}</p>
                      <p>Sessions: {workshopSessions.length}</p>
                    </div>

                    {getWorkshopMaterial(workshop) ? (
                      <p className="mt-3 break-all text-xs text-slate-500">
                        Material: {getWorkshopMaterial(workshop)}
                      </p>
                    ) : null}

                    <div className="mt-6 flex flex-wrap gap-2">
                      {workshop.slug ? (
                        <Link
                          href={`/workshops/${workshop.slug}`}
                          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </Link>
                      ) : null}

                      <Link
                        href={`/admin/workshops/${workshop.id}/edit`}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                      >
                        Edit
                      </Link>

                      <form action={deleteWorkshop}>
                        <input type="hidden" name="id" value={workshop.id} />

                        <button
                          type="submit"
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
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
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createWorkshop, createWorkshopSession } from "./actions";
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
  description?: string | null;
  instructor?: string | null;
  speaker?: string | null;
  format?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  date?: string | null;
  duration?: string | null;
  price?: number | null;
  currency?: string | null;
  capacity?: number | null;
  image_url?: string | null;
  cover_url?: string | null;
  thumbnail_url?: string | null;
  material_url?: string | null;
  is_featured?: boolean | null;
  is_published?: boolean | null;
  is_active?: boolean | null;
  created_at?: string | null;
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

  const { data, error } = await supabase
    .from("workshops")
    .select("*")
    .order("created_at", { ascending: false });

  const workshops = (data ?? []) as Workshop[];

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
          Create workshops, edit workshop details, add session arrangements,
          upload small session media, and add YouTube / Jianying external video
          links.
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

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Add New Workshop
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Create a new public workshop page. You can edit it later.
        </p>

        <form action={createWorkshop} className="mt-6 grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Workshop title
              </label>
              <input
                name="title"
                required
                placeholder="From Research Idea to Publication"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Slug
              </label>
              <input
                name="slug"
                placeholder="from-research-idea-to-publication"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Level
              </label>
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
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Language
              </label>
              <input
                name="language"
                defaultValue="English"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Format
              </label>
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
          </div>

          <textarea
            name="short_description"
            rows={3}
            placeholder="Short description shown near the title"
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
              placeholder="Location, e.g. Zoom / Shanghai / Online"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Start date
              </label>
              <input
                name="start_date"
                type="date"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                End date
              </label>
              <input
                name="end_date"
                type="date"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Duration
              </label>
              <input
                name="duration"
                placeholder="3 weeks / 12 hours"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
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
          Add Workshop Session
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Add class dates, Zoom links, recordings, session materials, local
          pictures, small local videos, YouTube videos, or Jianying / 剪映 links
          for large workshop videos.
        </p>

        <form action={createWorkshopSession} className="mt-6 grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Select workshop
            </label>
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
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Session title
              </label>
              <input
                name="title"
                placeholder="Session 1: Introduction"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Session date
              </label>
              <input
                name="session_date"
                type="date"
                required
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Start time
              </label>
              <input
                name="start_time"
                type="time"
                required
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                End time
              </label>
              <input
                name="end_time"
                type="time"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Display order
              </label>
              <input
                name="display_order"
                type="number"
                defaultValue={0}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          <input
            name="location"
            placeholder="Session location, e.g. Zoom / Room 201 / Online"
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

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              YouTube / Jianying / external video link
            </label>

            <input
              name="external_video_url"
              placeholder="Paste YouTube, Jianying / 剪映, or external video link here"
              className="w-full rounded-xl border px-4 py-3"
            />

            <p className="mt-2 text-xs text-slate-500">
              For YouTube links, the workshop page can embed and play the
              video. For Jianying links, the page will show an external video
              button because Jianying share pages usually cannot be embedded.
            </p>
          </div>

          <label className="flex items-center gap-2">
            <input name="is_active" type="checkbox" defaultChecked />
            <span>Show this session</span>
          </label>

          <button type="submit" className="btn-primary w-fit">
            Add Session
          </button>
        </form>
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
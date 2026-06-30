import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createWorkshop, createWorkshopSession } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Workshop = {
  id: string;
  title?: string | null;
  slug?: string | null;
  level?: string | null;
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
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Admin Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Manage Workshops
        </h1>

        <p className="mt-4 max-w-2xl text-slate-600">
          Create, modify, publish, feature, edit levels, manage materials, add
          sessions, or delete workshops.
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

        <form action={createWorkshop} className="mt-6 grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Workshop title
            </label>
            <input
              name="title"
              required
              placeholder="e.g. Python for Research Writing"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Slug
              </label>
              <input
                name="slug"
                placeholder="auto-generated-if-empty"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

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
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Short description
            </label>
            <textarea
              name="short_description"
              rows={3}
              placeholder="Short summary shown on cards"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Full description
            </label>
            <textarea
              name="description"
              rows={6}
              placeholder="Full workshop description"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Instructor / Speaker
              </label>
              <input
                name="instructor"
                placeholder="Instructor name"
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
                placeholder="e.g. 3 weeks / 12 hours"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Price
              </label>
              <input
                name="price"
                type="number"
                step="0.01"
                defaultValue={0}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Currency
              </label>
              <input
                name="currency"
                defaultValue="USD"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Capacity
              </label>
              <input
                name="capacity"
                type="number"
                defaultValue={0}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                name="location"
                placeholder="Zoom / Shanghai / Online"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cover image URL
              </label>
              <input
                name="image_url"
                placeholder="Paste image URL"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Material URL
              </label>
              <input
                name="material_url"
                placeholder="Paste uploaded material URL"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-5">
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
          Use this to add class dates, Zoom links, recordings, or session
          materials to an existing workshop.
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
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <input
              name="start_time"
              placeholder="Start time, e.g. 19:00"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="end_time"
              placeholder="End time, e.g. 21:00"
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
          <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-slate-600">
            No workshops yet.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Workshop</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Published</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {workshops.map((workshop) => {
                  const published =
                    workshop.is_published !== false &&
                    workshop.is_active !== false;

                  return (
                    <tr key={workshop.id} className="border-t border-slate-100">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-950">
                          {workshop.title}
                        </div>
                        <div className="mt-1 line-clamp-2 max-w-md text-xs text-slate-500">
                          {workshop.short_description ||
                            workshop.summary ||
                            workshop.description ||
                            ""}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {workshop.level || "Beginner"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {workshop.format || "Online"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {workshop.start_date || workshop.date || "-"}
                      </td>

                      <td className="px-4 py-4">
                        {published ? "Yes" : "No"}
                      </td>

                      <td className="px-4 py-4">
                        {workshop.is_featured ? "Yes" : "No"}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/workshops/${workshop.id}/edit`}
                            className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Edit
                          </Link>

                          <Link
                            href={`/admin/workshops/${workshop.id}/delete`}
                            className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </Link>
                        </div>
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
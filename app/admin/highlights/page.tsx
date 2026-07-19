export const revalidate = 0;
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createHighlight, deleteHighlight } from "./actions";

export default async function AdminHighlightsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const supabase = await createClient();

  const { data: highlights } = await supabase
    .from("session_highlights")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-4xl font-bold text-slate-950">
          Session Highlights
        </h1>

        <p className="mt-4 max-w-2xl text-slate-600">
          Add previous workshops, training sessions, pictures, videos, and event
          highlights to the homepage.
        </p>

        {params.message && (
          <div className="mt-6 rounded-xl bg-blue-50 p-4 text-blue-700">
            {params.message}
          </div>
        )}

        <form
          action={createHighlight}
          className="mt-8 grid gap-4 rounded-3xl border bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold">Add New Highlight</h2>

          <input
            name="title"
            placeholder="Session title"
            required
            className="rounded-xl border px-4 py-3"
          />

          <input
            name="subtitle"
            placeholder="Subtitle, e.g. Hands-on training"
            className="rounded-xl border px-4 py-3"
          />

          <textarea
            name="description"
            placeholder="Description"
            rows={4}
            className="rounded-xl border px-4 py-3"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="session_date"
              type="date"
              className="rounded-xl border px-4 py-3"
            />

            <input
              name="location"
              placeholder="Location"
              className="rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
            Upload Session Image
            </label>

            <input
            name="image_file"
            type="file"
            accept="image/*"
            className="rounded-xl border px-4 py-3"
            />
         </div>

          <input
            name="video_url"
            placeholder="Direct .mp4 video URL, optional"
            className="rounded-xl border px-4 py-3"
          />

          <div className="grid gap-4 md:grid-cols-3">
            <input
              name="stat_value"
              placeholder="Stat value, e.g. 50+"
              className="rounded-xl border px-4 py-3"
            />

            <input
              name="stat_label"
              placeholder="Stat label, e.g. Participants"
              className="rounded-xl border px-4 py-3"
            />

            <input
              name="sort_order"
              type="number"
              defaultValue={1}
              className="rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="cta_label"
              placeholder="Button label"
              defaultValue="View More"
              className="rounded-xl border px-4 py-3"
            />

            <input
              name="cta_href"
              placeholder="Button link"
              defaultValue="/workshops"
              className="rounded-xl border px-4 py-3"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input name="is_active" type="checkbox" defaultChecked />
            Active
          </label>

          <button className="w-fit rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
            Save Highlight
          </button>
        </form>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {highlights?.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-3xl border bg-white shadow-sm"
            >
              <div className="h-52 bg-slate-200">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-950 text-white">
                    LexData
                  </div>
                )}
              </div>

              <div className="p-5">
                <p className="text-sm font-semibold text-blue-700">
                  {item.subtitle}
                </p>

                <h3 className="mt-1 text-xl font-bold">{item.title}</h3>

                <p className="mt-2 text-sm text-slate-600">
                  {item.description}
                </p>

                <form action={deleteHighlight} className="mt-4">
                  <input type="hidden" name="id" value={item.id} />

                  <button className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
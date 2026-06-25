import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createMediaItem, deleteMediaItem } from "./actions";

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const supabase = await createClient();

  const { data: mediaItems } = await supabase
    .from("media_items")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <main className="bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-950">
          Media Management
        </h1>

        <p className="mt-3 text-slate-600">
          Add image and video spaces for homepage, course pages, and promotional sections.
        </p>

        {params.message && (
          <div className="mt-6 rounded-xl bg-blue-50 p-4 text-blue-700">
            {params.message}
          </div>
        )}

        <form
          action={createMediaItem}
          className="mt-8 grid gap-4 rounded-3xl border bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold">Add Picture or Video</h2>

          <input
            name="title"
            placeholder="Title"
            required
            className="rounded-xl border px-4 py-3"
          />

          <select name="media_type" className="rounded-xl border px-4 py-3">
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
            Upload Image
            </label>

            <input
            name="image_file"
            type="file"
            accept="image/*"
            className="rounded-xl border px-4 py-3"
            />
        </div>

          <input
            name="alt"
            placeholder="Alt text"
            className="rounded-xl border px-4 py-3"
          />

          <textarea
            name="caption"
            placeholder="Caption"
            rows={3}
            className="rounded-xl border px-4 py-3"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="page_area"
              placeholder="Page area"
              defaultValue="home_gallery"
              className="rounded-xl border px-4 py-3"
            />

            <input
              name="sort_order"
              type="number"
              defaultValue={1}
              className="rounded-xl border px-4 py-3"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input name="is_active" type="checkbox" defaultChecked />
            Active
          </label>

          <button className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
            Save Media
          </button>
        </form>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {mediaItems?.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-3xl border bg-white shadow-sm"
            >
              <div className="h-44 bg-slate-200">
                {item.media_type === "video" ? (
                  <video
                    src={item.url}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.alt || item.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="p-5">
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.caption}</p>

                <form action={deleteMediaItem} className="mt-4">
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
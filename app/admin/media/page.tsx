import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHomeMediaItem, deleteHomeMediaItem } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomeMediaItem = {
  id: string;
  title?: string | null;
  description?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  button_text?: string | null;
  button_href?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

function isYouTubeUrl(url?: string | null) {
  if (!url) return false;
  return url.includes("youtube.com") || url.includes("youtu.be");
}

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();
  await requireAdmin();

  const { message } = await searchParams;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("home_media_items")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const items = (data ?? []) as HomeMediaItem[];

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
          Homepage Media
        </h1>

        <p className="mt-4 max-w-3xl text-slate-600">
          Add media cards that appear on the homepage. You can use image URLs,
          direct video URLs, YouTube links, or external media links.
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
          Add Homepage Media
        </h2>

        <form action={createHomeMediaItem} className="mt-6 grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <input
              name="title"
              required
              placeholder="LexData Training Session"
              className="w-full rounded-xl border px-4 py-3"
            />

            <select
              name="media_type"
              defaultValue="image"
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="image">Image</option>
              <option value="video">Direct video</option>
              <option value="external_video">YouTube / external video</option>
              <option value="external">External link</option>
            </select>
          </div>

          <textarea
            name="description"
            rows={3}
            placeholder="Practical workshops for members, teachers, and researchers."
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="media_url"
            placeholder="Image URL, video URL, YouTube URL, or external media URL"
            className="w-full rounded-xl border px-4 py-3"
          />

          <div className="grid gap-5 md:grid-cols-3">
            <input
              name="button_text"
              defaultValue="Learn more"
              placeholder="Button text"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="button_href"
              defaultValue="/workshops"
              placeholder="/workshops"
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

          <label className="flex items-center gap-2">
            <input name="is_active" type="checkbox" defaultChecked />
            <span>Show on homepage</span>
          </label>

          <button type="submit" className="btn-primary w-fit">
            Add Homepage Media
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Current Homepage Media
        </h2>

        {items.length === 0 ? (
          <p className="mt-4 text-slate-600">No homepage media yet.</p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                {item.media_url ? (
                  item.media_type === "video" ? (
                    <video
                      src={item.media_url}
                      controls
                      className="h-56 w-full object-cover"
                    />
                  ) : isYouTubeUrl(item.media_url) ? (
                    <div className="flex h-56 items-center justify-center bg-slate-950 p-6 text-center text-white">
                      <a
                        href={item.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
                      >
                        Open YouTube / external media
                      </a>
                    </div>
                  ) : (
                    <img
                      src={item.media_url}
                      alt={item.title || "Media"}
                      className="h-56 w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-56 items-center justify-center bg-slate-100 text-sm text-slate-500">
                    No media URL
                  </div>
                )}

                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    {item.media_type || "image"} · Order{" "}
                    {item.display_order ?? 0}
                  </p>

                  <h3 className="mt-3 text-xl font-black text-slate-950">
                    {item.title}
                  </h3>

                  {item.description ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  ) : null}

                  <p className="mt-3 text-xs text-slate-500">
                    Status: {item.is_active ? "Visible" : "Hidden"}
                  </p>

                  <form action={deleteHomeMediaItem} className="mt-5">
                    <input type="hidden" name="id" value={item.id} />

                    <button
                      type="submit"
                      className="rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
export const revalidate = 0;
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createPromotion, updatePromotion, deletePromotion } from "./actions";

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const supabase = await createClient();

  const { data: promotions, error } = await supabase
    .from("promotions")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <p className="font-semibold text-blue-700">LexData Admin</p>

          <h1 className="mt-3 text-4xl font-bold text-slate-950">
            Promotion Management
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            Add homepage banners, campaign messages, image promotions, video
            promotions, and call-to-action buttons.
          </p>
        </div>

        {params.message && (
          <div className="mb-6 rounded-xl bg-blue-50 p-4 text-blue-700">
            {params.message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error.message}
          </div>
        )}

        <form
          action={createPromotion}
          className="mb-10 grid gap-4 rounded-3xl border bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-slate-950">
            Create New Promotion
          </h2>

          <input
            name="badge"
            placeholder="Badge, e.g. New Workshop"
            className="rounded-xl border px-4 py-3"
          />

          <input
            name="title"
            placeholder="Promotion title"
            required
            className="rounded-xl border px-4 py-3"
          />

          <textarea
            name="subtitle"
            placeholder="Promotion subtitle"
            rows={3}
            className="rounded-xl border px-4 py-3"
          />

          <input
            name="image_url"
            placeholder="Image URL"
            className="rounded-xl border px-4 py-3"
          />

          <input
            name="video_url"
            placeholder="Direct video URL, optional .mp4 link"
            className="rounded-xl border px-4 py-3"
          />

          <div className="grid gap-4 md:grid-cols-3">
            <input
              name="cta_label"
              placeholder="Button text"
              defaultValue="Learn More"
              className="rounded-xl border px-4 py-3"
            />

            <input
              name="cta_href"
              placeholder="Button link"
              defaultValue="/courses"
              className="rounded-xl border px-4 py-3"
            />

            <input
              name="sort_order"
              type="number"
              placeholder="Sort order"
              defaultValue={1}
              className="rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="starts_at"
              type="datetime-local"
              className="rounded-xl border px-4 py-3"
            />

            <input
              name="ends_at"
              type="datetime-local"
              className="rounded-xl border px-4 py-3"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input name="is_active" type="checkbox" defaultChecked />
            Active
          </label>

          <button className="w-fit rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
            Create Promotion
          </button>
        </form>

        <div className="grid gap-6">
          {promotions?.map((promotion) => (
            <form
              key={promotion.id}
              action={updatePromotion}
              className="rounded-3xl border bg-white p-6 shadow-sm"
            >
              <input type="hidden" name="id" value={promotion.id} />

              <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <p className="text-sm font-semibold text-blue-700">
                    {promotion.badge || "Promotion"}
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    {promotion.title}
                  </h2>
                </div>

                <div className="flex gap-2">
                  <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                    Save
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                <input
                  name="badge"
                  defaultValue={promotion.badge || ""}
                  placeholder="Badge"
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  name="title"
                  defaultValue={promotion.title || ""}
                  placeholder="Title"
                  required
                  className="rounded-xl border px-4 py-3"
                />

                <textarea
                  name="subtitle"
                  defaultValue={promotion.subtitle || ""}
                  placeholder="Subtitle"
                  rows={3}
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  name="image_url"
                  defaultValue={promotion.image_url || ""}
                  placeholder="Image URL"
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  name="video_url"
                  defaultValue={promotion.video_url || ""}
                  placeholder="Video URL"
                  className="rounded-xl border px-4 py-3"
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    name="cta_label"
                    defaultValue={promotion.cta_label || "Learn More"}
                    placeholder="Button text"
                    className="rounded-xl border px-4 py-3"
                  />

                  <input
                    name="cta_href"
                    defaultValue={promotion.cta_href || "/courses"}
                    placeholder="Button link"
                    className="rounded-xl border px-4 py-3"
                  />

                  <input
                    name="sort_order"
                    type="number"
                    defaultValue={promotion.sort_order || 0}
                    className="rounded-xl border px-4 py-3"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    name="is_active"
                    type="checkbox"
                    defaultChecked={promotion.is_active}
                  />
                  Active
                </label>
              </div>
            </form>
          ))}
        </div>

        <div className="mt-8 grid gap-4">
          {promotions?.map((promotion) => (
            <form
              key={`delete-${promotion.id}`}
              action={deletePromotion}
              className="rounded-2xl border bg-white p-4"
            >
              <input type="hidden" name="id" value={promotion.id} />

              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-slate-950">
                  Delete: {promotion.title}
                </p>

                <button className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                  Delete
                </button>
              </div>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
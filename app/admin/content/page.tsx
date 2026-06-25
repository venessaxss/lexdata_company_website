import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { updateSiteContent } from "./actions";

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const supabase = await createClient();

  const { data: contentBlocks, error } = await supabase
    .from("site_content")
    .select("*")
    .order("key", { ascending: true });

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <p className="font-semibold text-blue-700">LexData Admin</p>

          <h1 className="mt-3 text-4xl font-bold text-slate-950">
            Site Content
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            Edit homepage text, about page text, service copy, call-to-action
            buttons, and public website content.
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

        {!contentBlocks?.length && (
          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              No content blocks found
            </h2>

            <p className="mt-3 text-slate-600">
              Run the SQL seed for the site_content table in Supabase first.
            </p>
          </div>
        )}

        <div className="grid gap-6">
          {contentBlocks?.map((block) => (
            <form
              key={block.id}
              action={updateSiteContent}
              className="rounded-3xl border bg-white p-6 shadow-sm"
            >
              <input type="hidden" name="id" value={block.id} />

              <div className="mb-4">
                <p className="text-sm font-semibold text-blue-700">
                  {block.key}
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {block.title}
                </h2>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Title
                  </label>
                  <input
                    name="title"
                    defaultValue={block.title || ""}
                    className="w-full rounded-xl border px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Body
                  </label>
                  <textarea
                    name="body"
                    defaultValue={block.body || ""}
                    rows={5}
                    className="w-full rounded-xl border px-4 py-3"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Image URL
                    </label>
                    <input
                      name="image_url"
                      defaultValue={block.image_url || ""}
                      className="w-full rounded-xl border px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Button Label
                    </label>
                    <input
                      name="cta_label"
                      defaultValue={block.cta_label || ""}
                      className="w-full rounded-xl border px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Button Link
                    </label>
                    <input
                      name="cta_href"
                      defaultValue={block.cta_href || ""}
                      className="w-full rounded-xl border px-4 py-3"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    name="is_active"
                    type="checkbox"
                    defaultChecked={block.is_active}
                  />
                  Active
                </label>

                <button className="w-fit rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
                  Save Changes
                </button>
              </div>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
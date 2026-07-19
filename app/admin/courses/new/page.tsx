export const revalidate = 0;
export const dynamic = "force-dynamic";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createCourse } from "../actions";

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .order("name");

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/admin/courses" className="text-sm font-semibold">
        -&gt;Back
      </Link>

      <h1 className="mt-4 text-3xl font-bold">Create course</h1>

      <p className="mt-2 text-slate-600">
        Create a LexData course, publish it, and optionally show it in the
        homepage highlighted course section.
      </p>

      {params.message ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {params.message}
        </p>
      ) : null}

      <form action={createCourse} className="card mt-8 space-y-5 p-6">
        <div>
          <label className="label">Title</label>
          <input
            name="title"
            required
            className="input mt-2"
            placeholder="AI-Powered Academic Research"
          />
        </div>

        <div>
          <label className="label">Slug</label>
          <input
            name="slug"
            className="input mt-2"
            placeholder="ai-powered-academic-research"
          />
          <p className="mt-2 text-xs text-slate-500">
            Leave empty to generate automatically from the title.
          </p>
        </div>

        <div>
          <label className="label">Category</label>
          <select name="category_id" className="input mt-2">
            <option value="">No category</option>
            {(categories ?? []).map((category: any) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Level</label>
            <input
              name="level"
              defaultValue="Beginner to Intermediate"
              className="input mt-2"
            />
          </div>

          <div>
            <label className="label">Language</label>
            <input
              name="language"
              defaultValue="English"
              className="input mt-2"
            />
          </div>
        </div>

        <div>
          <label className="label">Short description</label>
          <textarea
            name="short_description"
            className="textarea mt-2"
            rows={4}
            placeholder="A practical LexData course for students, researchers, and educators who want to use AI tools, corpus methods, and digital research workflows..."
          />
        </div>

        <div>
          <label className="label">Course introduction</label>
          <textarea
            name="intro"
            className="textarea mt-2"
            rows={12}
            placeholder="Write the full course introduction, learning outcomes, target audience, and course structure here."
          />
        </div>

        <div>
          <label className="label">Cover image URL</label>
          <input
            name="cover_url"
            className="input mt-2"
            placeholder="https://..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Price cents</label>
            <input
              type="number"
              name="price_cents"
              defaultValue="0"
              className="input mt-2"
              placeholder="0 or 9900"
            />
            <p className="mt-2 text-xs text-slate-500">
              Example: 9900 = $99.00
            </p>
          </div>

          <div>
            <label className="label">Currency</label>
            <input
              name="currency"
              defaultValue="usd"
              className="input mt-2"
            />
          </div>

          <div>
            <label className="label">Stripe price ID</label>
            <input
              name="stripe_price_id"
              className="input mt-2"
              placeholder="optional price_xxx"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="text-lg font-black text-slate-950">
            Homepage highlight
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use this section if you want this course to appear in the homepage
            highlighted course area.
          </p>

          <label className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" name="is_home_highlighted" />
            Show this course on homepage highlight
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Highlight order</label>
              <input
                type="number"
                name="home_highlight_order"
                defaultValue="0"
                className="input mt-2"
              />
            </div>

            <div>
              <label className="label">Badge text</label>
              <input
                name="home_badge"
                defaultValue="Featured Course"
                className="input mt-2"
              />
            </div>

            <div>
              <label className="label">CTA text</label>
              <input
                name="home_cta"
                defaultValue="View Course"
                className="input mt-2"
              />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <input type="checkbox" name="is_published" />
          Publish now
        </label>

        <button className="btn-primary">Create course</button>
      </form>
    </section>
  );
}
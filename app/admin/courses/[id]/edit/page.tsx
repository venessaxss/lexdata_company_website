import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateCourse } from "../../actions";

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (!course) {
    notFound();
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .order("name");

  const updateAction = updateCourse.bind(null, course.id);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/admin/courses" className="text-sm font-semibold">
        ← Back
      </Link>

      <h1 className="mt-4 text-3xl font-bold">Edit course</h1>

      <p className="mt-2 text-slate-600">
        Update course details, publication status, payment information, and
        homepage highlight visibility.
      </p>

      {sp.message ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {sp.message}
        </p>
      ) : null}

      <form action={updateAction} className="card mt-8 space-y-5 p-6">
        <div>
          <label className="label">Title</label>
          <input
            name="title"
            required
            defaultValue={course.title ?? ""}
            className="input mt-2"
          />
        </div>

        <div>
          <label className="label">Slug</label>
          <input
            name="slug"
            defaultValue={course.slug ?? ""}
            className="input mt-2"
          />
          <p className="mt-2 text-xs text-slate-500">
            This controls the public course URL.
          </p>
        </div>

        <div>
          <label className="label">Category</label>
          <select
            name="category_id"
            defaultValue={course.category_id ?? ""}
            className="input mt-2"
          >
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
              defaultValue={course.level ?? "Beginner"}
              className="input mt-2"
            />
          </div>

          <div>
            <label className="label">Language</label>
            <input
              name="language"
              defaultValue={course.language ?? "English"}
              className="input mt-2"
            />
          </div>
        </div>

        <div>
          <label className="label">Short description</label>
          <textarea
            name="short_description"
            defaultValue={course.short_description ?? ""}
            className="textarea mt-2"
            rows={4}
          />
        </div>

        <div>
          <label className="label">Course introduction</label>
          <textarea
            name="intro"
            defaultValue={course.intro ?? ""}
            className="textarea mt-2"
            rows={12}
          />
        </div>

        <div>
          <label className="label">Cover image URL</label>
          <input
            name="cover_url"
            defaultValue={course.cover_url ?? ""}
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
              defaultValue={course.price_cents ?? 0}
              className="input mt-2"
            />
            <p className="mt-2 text-xs text-slate-500">
              Example: 9900 = $99.00
            </p>
          </div>

          <div>
            <label className="label">Currency</label>
            <input
              name="currency"
              defaultValue={course.currency ?? "usd"}
              className="input mt-2"
            />
          </div>

          <div>
            <label className="label">Stripe price ID</label>
            <input
              name="stripe_price_id"
              defaultValue={course.stripe_price_id ?? ""}
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
            <input
              type="checkbox"
              name="is_home_highlighted"
              defaultChecked={Boolean(course.is_home_highlighted)}
            />
            Show this course on homepage highlight
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Highlight order</label>
              <input
                type="number"
                name="home_highlight_order"
                defaultValue={course.home_highlight_order ?? 0}
                className="input mt-2"
              />
            </div>

            <div>
              <label className="label">Badge text</label>
              <input
                name="home_badge"
                defaultValue={course.home_badge ?? "Featured Course"}
                className="input mt-2"
              />
            </div>

            <div>
              <label className="label">CTA text</label>
              <input
                name="home_cta"
                defaultValue={course.home_cta ?? "View Course"}
                className="input mt-2"
              />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={Boolean(course.is_published)}
          />
          Published
        </label>

        <button className="btn-primary">Save changes</button>
      </form>
    </section>
  );
}
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createCourse } from "../actions";

export default async function NewCoursePage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id,name").order("name");

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/admin/courses" className="text-sm font-semibold">← Back</Link>
      <h1 className="mt-4 text-3xl font-bold">Create course</h1>
      {params.message ? <p className="mt-4 text-sm text-red-600">{params.message}</p> : null}

      <form action={createCourse} className="card mt-8 space-y-5 p-6">
        <div>
          <label className="label">Title</label>
          <input name="title" required className="input mt-2" placeholder="Python for Data Analysis" />
        </div>
        <div>
          <label className="label">Slug</label>
          <input name="slug" className="input mt-2" placeholder="python-data-analysis" />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category_id" className="input mt-2">
            <option value="">No category</option>
            {(categories ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Level</label>
            <input name="level" defaultValue="Beginner" className="input mt-2" />
          </div>
          <div>
            <label className="label">Language</label>
            <input name="language" defaultValue="English" className="input mt-2" />
          </div>
        </div>
        <div>
          <label className="label">Short description</label>
          <textarea name="short_description" className="textarea mt-2" />
        </div>
        <div>
          <label className="label">Course introduction</label>
          <textarea name="intro" className="textarea mt-2" />
        </div>
        <div>
          <label className="label">Cover image URL</label>
          <input name="cover_url" className="input mt-2" placeholder="https://..." />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" /> Publish now
        </label>
        <button className="btn-primary">Create course</button>
      </form>
    </section>
  );
}

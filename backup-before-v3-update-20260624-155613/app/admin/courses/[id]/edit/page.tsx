import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateCourse } from "../../actions";

export default async function EditCoursePage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ message?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();
  if (!course) notFound();
  const { data: categories } = await supabase.from("categories").select("id,name").order("name");

  const updateAction = updateCourse.bind(null, course.id);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/admin/courses" className="text-sm font-semibold">← Back</Link>
      <h1 className="mt-4 text-3xl font-bold">Edit course</h1>
      {sp.message ? <p className="mt-4 text-sm text-red-600">{sp.message}</p> : null}

      <form action={updateAction} className="card mt-8 space-y-5 p-6">
        <div>
          <label className="label">Title</label>
          <input name="title" required defaultValue={course.title} className="input mt-2" />
        </div>
        <div>
          <label className="label">Slug</label>
          <input name="slug" defaultValue={course.slug} className="input mt-2" />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category_id" defaultValue={course.category_id ?? ""} className="input mt-2">
            <option value="">No category</option>
            {(categories ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Level</label>
            <input name="level" defaultValue={course.level ?? "Beginner"} className="input mt-2" />
          </div>
          <div>
            <label className="label">Language</label>
            <input name="language" defaultValue={course.language ?? "English"} className="input mt-2" />
          </div>
        </div>
        <div>
          <label className="label">Short description</label>
          <textarea name="short_description" defaultValue={course.short_description ?? ""} className="textarea mt-2" />
        </div>
        <div>
          <label className="label">Course introduction</label>
          <textarea name="intro" defaultValue={course.intro ?? ""} className="textarea mt-2" />
        </div>
        <div>
          <label className="label">Cover image URL</label>
          <input name="cover_url" defaultValue={course.cover_url ?? ""} className="input mt-2" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={course.is_published} /> Published
        </label>
        <button className="btn-primary">Save changes</button>
      </form>
    </section>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createLesson } from "../../actions";

export default async function CourseLessonsAdminPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ message?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("id,title").eq("id", id).single();
  if (!course) notFound();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,title,position,is_published,video_url")
    .eq("course_id", id)
    .order("position");

  const createLessonAction = createLesson.bind(null, course.id);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <Link href="/admin/courses" className="text-sm font-semibold">← Back</Link>
      <h1 className="mt-4 text-3xl font-bold">Lessons: {course.title}</h1>
      {sp.message ? <p className="mt-4 text-sm text-red-600">{sp.message}</p> : null}

      <div className="mt-8 grid gap-8 md:grid-cols-[0.55fr_0.45fr]">
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">#</th><th>Title</th><th>Status</th></tr></thead>
            <tbody>
              {(lessons ?? []).map((lesson: any) => (
                <tr key={lesson.id} className="border-t border-slate-100">
                  <td className="p-4">{lesson.position}</td>
                  <td>{lesson.title}</td>
                  <td>{lesson.is_published ? "Published" : "Draft"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={createLessonAction} className="card space-y-4 p-6">
          <h2 className="text-xl font-semibold">Add lesson</h2>
          <div>
            <label className="label">Position</label>
            <input name="position" type="number" min="1" defaultValue={(lessons?.length ?? 0) + 1} className="input mt-2" />
          </div>
          <div>
            <label className="label">Title</label>
            <input name="title" required className="input mt-2" />
          </div>
          <div>
            <label className="label">Video URL / embed URL</label>
            <input name="video_url" className="input mt-2" placeholder="https://www.youtube.com/embed/..." />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea name="content" className="textarea mt-2" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_published" /> Publish now
          </label>
          <button className="btn-primary">Add lesson</button>
        </form>
      </div>
    </section>
  );
}

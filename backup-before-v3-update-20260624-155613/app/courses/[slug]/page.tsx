import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { enrollCourse } from "./actions";

export default async function CourseDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ message?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id,title,slug,short_description,intro,level,language,cover_url,is_published,updated_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!course) notFound();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,title,content,video_url,position")
    .eq("course_id", course.id)
    .eq("is_published", true)
    .order("position");

  const enrollAction = enrollCourse.bind(null, course.id, course.slug);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="card overflow-hidden">
        <div className="flex h-64 items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-700 text-white">
          {course.cover_url ? <img src={course.cover_url} alt="" className="h-full w-full object-cover" /> : (
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-100">LexData</p>
              <h2 className="mt-3 text-3xl font-black">Research Training</h2>
            </div>
          )}
        </div>
        <div className="p-8">
          <p className="text-sm text-slate-500">{course.level ?? "All levels"} · {course.language ?? "English"}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">{course.title}</h1>
          <p className="mt-4 text-lg text-slate-600">{course.short_description}</p>
          <form action={enrollAction} className="mt-6">
            <button className="btn-primary">Enroll / Continue</button>
          </form>
          {sp.message ? <p className="mt-4 text-sm text-red-600">{sp.message}</p> : null}
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[0.7fr_0.3fr]">
        <div className="card p-6">
          <h2 className="text-2xl font-semibold">Course introduction</h2>
          <p className="mt-4 whitespace-pre-line text-slate-700">{course.intro}</p>
        </div>
        <aside className="card p-6">
          <h2 className="font-semibold">Lessons</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-700">
            {(lessons ?? []).map((lesson: any) => (
              <li key={lesson.id}>
                <Link href={`/courses/${course.slug}/lessons/${lesson.id}`} className="hover:underline">
                  {lesson.position}. {lesson.title}
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markLessonComplete } from "./progress-actions";

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login?message=Please login first");

  const { data: course } = await supabase
    .from("courses")
    .select("id,title,slug")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", course.id)
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!enrollment) redirect(`/courses/${slug}?message=Enroll before opening lessons`);

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id,title,content,video_url,position")
    .eq("id", lessonId)
    .eq("course_id", course.id)
    .eq("is_published", true)
    .single();
  if (!lesson) notFound();

  const completeAction = markLessonComplete.bind(null, lesson.id, slug);

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <Link href={`/courses/${slug}`} className="text-sm font-semibold">← Back to course</Link>
      <article className="card mt-5 p-8">
        <p className="text-sm text-slate-500">Lesson {lesson.position} · {course.title}</p>
        <h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1>
        {lesson.video_url ? (
          <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-slate-200">
            <iframe src={lesson.video_url} className="h-full w-full" allowFullScreen />
          </div>
        ) : null}
        <div className="prose prose-slate mt-8 max-w-none whitespace-pre-line text-slate-700">
          {lesson.content}
        </div>
        <form action={completeAction} className="mt-8">
          <button className="btn-primary">Mark complete</button>
        </form>
      </article>
    </section>
  );
}

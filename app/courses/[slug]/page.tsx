import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { enrollCourseAction } from "@/app/courses/[slug]/enroll-actions";

function money(cents: number, currency: string) {
  if (!cents || cents <= 0) return "Free";

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id,title,slug,short_description,intro,level,language,cover_url,is_published,updated_at,price_cents,currency"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!course) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existingEnrollment: any = null;

  if (user) {
    const { data } = await supabase
      .from("course_enrollments")
      .select("id,enrollment_status,payment_status,note")
      .eq("course_id", course.id)
      .eq("user_id", user.id)
      .maybeSingle();

    existingEnrollment = data;
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,title,content,video_url,position")
    .eq("course_id", course.id)
    .eq("is_published", true)
    .order("position");

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="card overflow-hidden">
        <div className="h-64 bg-slate-200">
          {course.cover_url ? (
            <img
              src={course.cover_url}
              alt={course.title}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="p-8">
          <p className="text-sm text-slate-500">
            {course.level ?? "All levels"} · {course.language ?? "English"}
          </p>

          <h1 className="mt-2 text-4xl font-bold">{course.title}</h1>

          <p className="mt-4 text-lg text-slate-600">
            {course.short_description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <p className="text-2xl font-bold">
              {money(course.price_cents, course.currency)}
            </p>

            {existingEnrollment ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
                <p className="text-sm font-black text-blue-800">
                  You are enrolled / requested access
                </p>

                <p className="mt-1 text-xs font-bold text-blue-700">
                  Enrollment: {existingEnrollment.enrollment_status} · Payment:{" "}
                  {existingEnrollment.payment_status}
                </p>
              </div>
            ) : (
              <form action={enrollCourseAction}>
                <input type="hidden" name="course_id" value={course.id} />
                <input type="hidden" name="slug" value={course.slug} />

                <button className="btn-primary">Enroll Course</button>
              </form>
            )}
          </div>

          {sp.message ? (
            <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
              {sp.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[0.7fr_0.3fr]">
        <div className="card p-6">
          <h2 className="text-2xl font-semibold">Course introduction</h2>
          <p className="mt-4 whitespace-pre-line text-slate-700">
            {course.intro}
          </p>
        </div>

        <aside className="card p-6">
          <h2 className="font-semibold">Lessons</h2>

          {existingEnrollment?.enrollment_status === "approved" ? (
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              {(lessons ?? []).map((lesson: any) => (
                <li key={lesson.id}>
                  <Link
                    href={`/courses/${course.slug}/lessons/${lesson.id}`}
                    className="hover:underline"
                  >
                    {lesson.position}. {lesson.title}
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Lessons will be available after your enrollment is approved.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
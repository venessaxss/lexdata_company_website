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

  const isApproved =
    existingEnrollment?.enrollment_status === "approved" ||
    existingEnrollment?.enrollment_status === "confirmed";

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-64 bg-slate-200">
          {course.cover_url ? (
            <img
              src={course.cover_url}
              alt={course.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-950 text-4xl font-black text-white">
              LexData
            </div>
          )}
        </div>

        <div className="p-8">
          <p className="text-sm font-bold text-slate-500">
            {course.level ?? "All levels"} · {course.language ?? "English"}
          </p>

          <h1 className="mt-2 text-4xl font-black text-slate-950">
            {course.title}
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            {course.short_description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <p className="text-2xl font-black text-slate-950">
              {money(course.price_cents, course.currency)}
            </p>

            {!user ? (
              <Link
                href={`/login?message=Please login before enrolling in this course.`}
                className="inline-flex cursor-pointer rounded-2xl bg-blue-700 px-7 py-4 text-base font-black text-white shadow-sm hover:bg-blue-800"
              >
                Login to Enroll
              </Link>
            ) : existingEnrollment ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
                <p className="text-sm font-black text-blue-800">
                  You have already requested access
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

                <button
                  type="submit"
                  className="inline-flex cursor-pointer rounded-2xl bg-blue-700 px-7 py-4 text-base font-black text-white shadow-sm hover:bg-blue-800"
                >
                  Enroll Course
                </button>
              </form>
            )}
          </div>

          {sp.message ? (
            <p className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
              {sp.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[0.7fr_0.3fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            Course introduction
          </h2>

          <p className="mt-4 whitespace-pre-line leading-8 text-slate-700">
            {course.intro}
          </p>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Lessons</h2>

          {isApproved ? (
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              {(lessons ?? []).map((lesson: any) => (
                <li key={lesson.id}>
                  <Link
                    href={`/courses/${course.slug}/lessons/${lesson.id}`}
                    className="font-bold text-blue-700 hover:underline"
                  >
                    {lesson.position}. {lesson.title}
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Lessons will be available after your enrollment is approved by the
              LexData team.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
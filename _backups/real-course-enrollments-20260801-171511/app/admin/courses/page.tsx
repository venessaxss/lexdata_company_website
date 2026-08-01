export const revalidate = 0;
export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { deleteCourse } from "./actions";

type CourseRow = {
  id: string;
  title?: string | null;
  slug?: string | null;
  is_published?: boolean | null;
  is_home_highlighted?: boolean | null;
  home_highlight_order?: number | null;
  updated_at?: string | null;
  categories?: { name?: string | null } | null;
};

type EnrollmentRow = {
  id?: string | null;
  course_id?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Not updated";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not updated";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function AdminCoursesPage() {
  const auth = await requireAdmin();

  const [coursesResult, enrollmentsResult] = await Promise.all([
    auth.admin
      .from("courses")
      .select(
        `
        id,
        title,
        slug,
        is_published,
        is_home_highlighted,
        home_highlight_order,
        updated_at,
        categories(name)
      `
      )
      .order("updated_at", { ascending: false }),

    auth.admin
      .from("enrollments")
      .select("id, course_id"),
  ]);

  const courses = (coursesResult.data || []) as CourseRow[];
  const enrollments =
    (enrollmentsResult.data || []) as EnrollmentRow[];

  const registrationCounts = new Map<string, number>();

  for (const enrollment of enrollments) {
    const courseId = String(enrollment.course_id || "");

    if (!courseId) continue;

    registrationCounts.set(
      courseId,
      (registrationCounts.get(courseId) || 0) + 1
    );
  }

  const publishedCount = courses.filter(
    (course) => course.is_published
  ).length;

  const highlightedCount = courses.filter(
    (course) => course.is_home_highlighted
  ).length;

  return (
    <main
      className="min-h-screen bg-[#f6f8fb] px-4 pb-16 sm:px-6 lg:px-8"
      style={{ paddingTop: "128px" }}
    >
      <div className="mx-auto w-full max-w-[1380px] space-y-6">
        <Link
          prefetch={false}
          href="/admin"
          className="inline-flex text-sm font-black text-slate-600 hover:text-slate-950"
        >
          &larr; Back to admin dashboard
        </Link>

        <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                Course library
              </p>

              <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Manage courses one by one
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Open one course to manage its content, lessons, public page,
                and participant registrations without the old wide table.
              </p>
            </div>

            <Link
              prefetch={false}
              href="/admin/courses/new"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800"
            >
              Create new course
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Total courses
              </p>
              <p className="mt-1 text-2xl font-black">
                {courses.length}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Published
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-950">
                {publishedCount}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                Homepage highlights
              </p>
              <p className="mt-1 text-2xl font-black text-blue-950">
                {highlightedCount}
              </p>
            </div>
          </div>
        </header>

        {coursesResult.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {coursesResult.error.message}
          </div>
        ) : null}

        {courses.length === 0 ? (
          <section className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-black text-slate-950">
              No courses found
            </h2>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {courses.map((course) => {
              const deleteAction = deleteCourse.bind(null, course.id);
              const registrations =
                registrationCounts.get(course.id) || 0;

              return (
                <article
                  key={course.id}
                  className="flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex-1 p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          course.is_published
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {course.is_published ? "Published" : "Draft"}
                      </span>

                      {course.is_home_highlighted ? (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          Highlighted
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950">
                      {course.title || "Untitled course"}
                    </h2>

                    <p className="mt-2 text-sm font-bold text-slate-600">
                      {course.categories?.name || "Uncategorized"}
                    </p>

                    <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Registrations
                        </dt>
                        <dd className="mt-1 text-xl font-black">
                          {registrations}
                        </dd>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Homepage order
                        </dt>
                        <dd className="mt-1 text-xl font-black">
                          {course.home_highlight_order || 0}
                        </dd>
                      </div>

                      <div className="col-span-2 rounded-2xl bg-slate-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Updated
                        </dt>
                        <dd className="mt-1 text-sm font-black">
                          {formatDate(course.updated_at)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                    <Link
                      prefetch={false}
                      href={`/admin/courses/${course.id}/edit`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800"
                    >
                      Edit course
                    </Link>

                    <Link
                      prefetch={false}
                      href={`/admin/courses/${course.id}/lessons`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-100"
                    >
                      Lessons
                    </Link>

                    <Link
                      prefetch={false}
                      href={`/manager/course-registrations/${course.id}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-black text-indigo-800 hover:bg-indigo-100"
                    >
                      Registrations
                    </Link>

                    {course.slug ? (
                      <Link
                        prefetch={false}
                        href={`/courses/${course.slug}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-100"
                      >
                        Public page
                      </Link>
                    ) : null}

                    <form action={deleteAction} className="sm:ml-auto">
                      <button className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-black text-red-700 hover:bg-red-50">
                        Delete
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireManagerOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;

function courseTitle(course: Row) {
  return String(
    course.title ||
      course.name ||
      course.course_title ||
      "Untitled course"
  );
}

function courseDescription(course: Row) {
  return String(
    course.short_description ||
      course.summary ||
      course.description ||
      "No course description has been added."
  );
}

function publicationLabel(course: Row) {
  const published =
    course.is_published === true ||
    course.published === true ||
    String(course.status || "").toLowerCase() === "published";

  return published ? "Published" : "Draft";
}

export default async function CourseRegistrationsPage() {
  noStore();

  const actor = await requireManagerOrAdmin(
    "/manager/course-registrations"
  );

  const [
    { data: courses, error: courseError },
    { data: enrollments, error: enrollmentError },
  ] = await Promise.all([
    actor.admin
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false }),

    actor.admin
      .from("enrollments")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const counts = new Map<
    string,
    {
      total: number;
      confirmed: number;
      pending: number;
      access: number;
    }
  >();

  for (const enrollment of enrollments || []) {
    const courseId = String(enrollment.course_id || "");

    if (!courseId) continue;

    const current = counts.get(courseId) || {
      total: 0,
      confirmed: 0,
      pending: 0,
      access: 0,
    };

    current.total += 1;

    const registrationStatus = String(
      enrollment.registration_status ||
        enrollment.status ||
        "confirmed"
    ).toLowerCase();

    if (registrationStatus === "confirmed") {
      current.confirmed += 1;
    }

    if (registrationStatus === "pending") {
      current.pending += 1;
    }

    const accessStatus = String(
      enrollment.access_status || "granted"
    ).toLowerCase();

    if (accessStatus === "granted") {
      current.access += 1;
    }

    counts.set(courseId, current);
  }

  const error = courseError || enrollmentError;

  return (
    <main
      className="min-h-screen bg-[#f6f8fb] px-4 pb-16 sm:px-6 lg:px-8"
      style={{ paddingTop: "128px" }}
    >
      <div className="mx-auto w-full max-w-[1380px] space-y-6">
        <Link
          href="/manager"
          className="text-sm font-black text-slate-600 hover:text-slate-950"
        >
          &larr; Back to manager dashboard
        </Link>

        <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
            Course registration library
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
            Manage registrations course by course
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Open one course to review its participants, registration
            approval, payment status, access status, receipt, and notes
            without mixing registrations from different courses.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error.message}
          </div>
        ) : null}

        {(courses || []).length === 0 ? (
          <section className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-black text-slate-950">
              No courses found
            </h2>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {(courses || []).map((course: Row) => {
              const courseId = String(course.id || "");
              const courseCounts = counts.get(courseId) || {
                total: 0,
                confirmed: 0,
                pending: 0,
                access: 0,
              };

              return (
                <article
                  key={courseId}
                  className="flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex-1 p-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                        {publicationLabel(course)}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        {courseCounts.total} registrations
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950">
                      {courseTitle(course)}
                    </h2>

                    <p
                      className="mt-3 min-h-[3rem] overflow-hidden text-sm leading-6 text-slate-600"
                      style={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                      }}
                    >
                      {courseDescription(course)}
                    </p>

                    <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase text-slate-500">
                          Total
                        </dt>
                        <dd className="mt-1 text-xl font-black">
                          {courseCounts.total}
                        </dd>
                      </div>

                      <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase text-emerald-700">
                          Confirmed
                        </dt>
                        <dd className="mt-1 text-xl font-black text-emerald-950">
                          {courseCounts.confirmed}
                        </dd>
                      </div>

                      <div className="rounded-2xl bg-amber-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase text-amber-700">
                          Pending
                        </dt>
                        <dd className="mt-1 text-xl font-black text-amber-950">
                          {courseCounts.pending}
                        </dd>
                      </div>

                      <div className="rounded-2xl bg-blue-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase text-blue-700">
                          Access
                        </dt>
                        <dd className="mt-1 text-xl font-black text-blue-950">
                          {courseCounts.access}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                    <Link
                      href={`/manager/course-registrations/${courseId}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800"
                    >
                      Manage this course
                    </Link>
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
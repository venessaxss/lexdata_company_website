import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireManagerOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;

function approved(row: Row) {
  const status = String(row.enrollment_status || "pending").toLowerCase();
  return status === "approved" || status === "confirmed";
}

export default async function CourseRegistrationsPage() {
  noStore();
  const auth = await requireManagerOrAdmin("/manager/course-registrations");

  const [{ data: courses, error: courseError }, { data: enrollments, error: enrollmentError }] =
    await Promise.all([
      auth.admin.from("courses").select("*").order("updated_at", { ascending: false }),
      auth.admin
        .from("course_enrollments")
        .select("id,course_id,user_id,full_name,email,enrollment_status,payment_status,note,created_at,updated_at")
        .order("created_at", { ascending: false }),
    ]);

  const counts = new Map<string, { total: number; approved: number; pending: number; paid: number }>();

  for (const row of enrollments || []) {
    const courseId = String(row.course_id || "");
    if (!courseId) continue;

    const current = counts.get(courseId) || { total: 0, approved: 0, pending: 0, paid: 0 };
    current.total += 1;
    if (approved(row)) current.approved += 1;
    if (String(row.enrollment_status || "pending") === "pending") current.pending += 1;
    if (["paid", "waived"].includes(String(row.payment_status || "pending"))) current.paid += 1;
    counts.set(courseId, current);
  }

  const error = courseError || enrollmentError;

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 pb-16 sm:px-6 lg:px-8" style={{ paddingTop: "112px" }}>
      <div className="mx-auto w-full max-w-[1380px] space-y-6">
        <Link href="/manager" className="text-sm font-black text-slate-600 hover:text-slate-950">
          &larr; Back to manager dashboard
        </Link>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
            Real course enrollments
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
            Manage enrollments course by course
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            These records come from the same course_enrollments table used by the public Enroll Course button.
          </p>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error.message}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {(courses || []).map((course: Row) => {
            const courseId = String(course.id);
            const c = counts.get(courseId) || { total: 0, approved: 0, pending: 0, paid: 0 };

            return (
              <article key={courseId} className="flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
                <div className="flex-1 p-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                      {course.is_published ? "Published" : "Draft"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {c.total} enrollment{c.total === 1 ? "" : "s"}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950">
                    {course.title || "Untitled course"}
                  </h2>

                  <p className="mt-3 line-clamp-2 min-h-[3rem] text-sm leading-6 text-slate-600">
                    {course.short_description || course.description || "No description added."}
                  </p>

                  <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Total", c.total, "bg-slate-50 text-slate-950"],
                      ["Approved", c.approved, "bg-emerald-50 text-emerald-950"],
                      ["Pending", c.pending, "bg-amber-50 text-amber-950"],
                      ["Paid / waived", c.paid, "bg-blue-50 text-blue-950"],
                    ].map(([label, count, style]) => (
                      <div key={String(label)} className={`rounded-2xl px-4 py-3 ${style}`}>
                        <dt className="text-[11px] font-black uppercase">{label}</dt>
                        <dd className="mt-1 text-xl font-black">{count}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                  <Link
                    href={`/manager/course-registrations/${courseId}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white"
                  >
                    Manage this course
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

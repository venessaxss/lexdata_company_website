import { requireAdminOrManager } from "@/lib/auth";

import { createAdminClient } from "@/lib/supabase/admin";
import { updateCourseEnrollmentAction } from "@/app/courses/[slug]/enroll-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ManagerCourseEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdminOrManager();

  const sp = await searchParams;
  const admin = createAdminClient();

  const { data: enrollments, error } = await admin
    .from("course_enrollments")
    .select(
      `
      id,
      full_name,
      email,
      enrollment_status,
      payment_status,
      note,
      created_at,
      courses (
        title,
        slug,
        price_cents,
        currency
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load course enrollments: ${error.message}`);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-700">
          Manager
        </p>

        <h1 className="mt-3 text-3xl font-black text-slate-950">
          Course Enrollments
        </h1>

        <p className="mt-2 text-slate-600">
          Review course enrollment requests and update course access status.
        </p>
      </div>

      {sp.message ? (
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
          {sp.message}
        </div>
      ) : null}

      <div className="mt-8 space-y-5">
        {(enrollments ?? []).length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">
            No course enrollments yet.
          </div>
        ) : null}

        {(enrollments ?? []).map((item: any) => (
          <article
            key={item.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  {item.full_name || "Unnamed member"}
                </h2>

                <p className="mt-1 text-sm font-bold text-slate-500">
                  {item.email || "No email"}
                </p>

                <p className="mt-3 text-base font-black text-blue-700">
                  {item.courses?.title || "Unknown course"}
                </p>

                <p className="mt-1 text-xs font-bold text-slate-400">
                  Requested:{" "}
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : "-"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                  Enrollment: {item.enrollment_status}
                </span>

                <span className="h-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                  Payment: {item.payment_status}
                </span>
              </div>
            </div>

            <form
              action={updateCourseEnrollmentAction}
              className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-4"
            >
              <input type="hidden" name="id" value={item.id} />

              <div>
                <label className="block text-xs font-black text-slate-500">
                  Enrollment status
                </label>

                <select
                  name="enrollment_status"
                  defaultValue={item.enrollment_status || "pending"}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500">
                  Payment status
                </label>

                <select
                  name="payment_status"
                  defaultValue={item.payment_status || "pending"}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="waived">Waived</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500">
                  Note
                </label>

                <input
                  name="note"
                  defaultValue={item.note || ""}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                  placeholder="Internal note"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-700"
                >
                  Save
                </button>
              </div>
            </form>
          </article>
        ))}
      </div>
    </main>
  );
}
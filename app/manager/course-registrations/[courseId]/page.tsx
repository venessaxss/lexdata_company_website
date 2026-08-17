import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/auth";
import { updateCourseEnrollmentAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;

function approved(row: Row) {
  const status = String(row.enrollment_status || "pending").toLowerCase();
  return status === "approved" || status === "confirmed";
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

export default async function CourseRegistrationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<{ q?: string; status?: string; message?: string; error?: string }>;
}) {
  noStore();
  const { courseId } = await params;
  const filters = searchParams ? await searchParams : {};
  const auth = await requireManagerOrAdmin(`/manager/course-registrations/${courseId}`);

  const [{ data: course, error: courseError }, { data: enrollmentRows, error: enrollmentError }] =
    await Promise.all([
      auth.admin.from("courses").select("*").eq("id", courseId).maybeSingle(),
      auth.admin
        .from("course_enrollments")
        .select("id,course_id,user_id,full_name,email,enrollment_status,payment_status,document_jurisdiction,note,created_at,updated_at")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false }),
    ]);

  if (courseError || !course) notFound();

  const enrollments = (enrollmentRows || []) as Row[];
  const q = String(filters.q || "").trim().toLowerCase();
  const status = String(filters.status || "all").toLowerCase();

  const visible = enrollments.filter((row) => {
    const haystack = `${row.full_name || ""} ${row.email || ""} ${row.user_id || ""}`.toLowerCase();
    const rowStatus = String(row.enrollment_status || "pending").toLowerCase();
    return (!q || haystack.includes(q)) &&
      (status === "all" || (status === "approved" ? approved(row) : rowStatus === status));
  });

  const approvedCount = enrollments.filter(approved).length;
  const pendingCount = enrollments.filter((row) => String(row.enrollment_status || "pending") === "pending").length;
  const paidCount = enrollments.filter((row) => ["paid", "waived"].includes(String(row.payment_status || "pending"))).length;

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 pb-16 sm:px-6 lg:px-8" style={{ paddingTop: "112px" }}>
      <div className="mx-auto w-full max-w-[1320px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/manager/course-registrations" className="text-sm font-black text-slate-600">
            &larr; All course enrollments
          </Link>
          <Link href="/manager" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black">
            Manager dashboard
          </Link>
        </div>

        <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
            Course enrollment workspace
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
            {course.title || "Untitled course"}
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Participants shown here submitted the real public course enrollment form.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total", enrollments.length, "bg-white border-slate-200"],
            ["Approved", approvedCount, "bg-emerald-50 border-emerald-200"],
            ["Pending", pendingCount, "bg-amber-50 border-amber-200"],
            ["Paid / waived", paidCount, "bg-blue-50 border-blue-200"],
          ].map(([label, count, style]) => (
            <div key={String(label)} className={`rounded-[22px] border px-5 py-4 shadow-sm ${style}`}>
              <p className="text-[11px] font-black uppercase">{label}</p>
              <p className="mt-2 text-3xl font-black">{count}</p>
            </div>
          ))}
        </section>

        {filters.message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
            {filters.message}
          </div>
        ) : null}

        {filters.error || enrollmentError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {filters.error || enrollmentError?.message}
          </div>
        ) : null}

        <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
            <input name="q" defaultValue={filters.q || ""} placeholder="Search name or email" className="min-h-11 rounded-xl border border-slate-300 px-4" />
            <select name="status" defaultValue={filters.status || "all"} className="min-h-11 rounded-xl border border-slate-300 px-4 font-bold">
              <option value="all">All enrollments</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="rounded-xl bg-slate-950 px-5 text-sm font-black text-white">Apply</button>
            <Link href={`/manager/course-registrations/${courseId}`} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-black">
              Reset
            </Link>
          </form>
        </section>

        <section className="space-y-4">
          {visible.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h2 className="text-xl font-black">No course enrollments found</h2>
              <p className="mt-2 text-sm text-slate-600">
                New requests from the public course page will appear here.
              </p>
            </div>
          ) : visible.map((row) => {
            const enrollmentStatus = String(row.enrollment_status || "pending");
            const paymentStatus = String(row.payment_status || "pending");

            return (
              <article key={String(row.id)} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/80 p-5 lg:flex-row lg:justify-between">
                  <div>
                    <h2 className="text-xl font-black">{row.full_name || row.email || "Course participant"}</h2>
                    <p className="mt-1 break-all text-sm text-slate-600">{row.email || row.user_id}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">Requested: {formatDate(row.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                      Enrollment: {enrollmentStatus}
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                      Payment: {paymentStatus}
                    </span>
                  </div>
                </div>

                <form action={updateCourseEnrollmentAction} className="grid gap-4 p-5 lg:grid-cols-[180px_180px_180px_minmax(0,1fr)_auto]">
                  <input type="hidden" name="enrollment_id" value={String(row.id)} />
                  <input type="hidden" name="course_id" value={courseId} />

                  <label className="grid gap-2 text-sm font-black">
                    Enrollment status
                    <select name="enrollment_status" defaultValue={enrollmentStatus} className="rounded-xl border border-slate-300 px-4 py-3">
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-black">
                    Issuing jurisdiction
                    <select name="document_jurisdiction" defaultValue={String(row.document_jurisdiction || "PK")} className="rounded-xl border border-slate-300 px-4 py-3">
                      <option value="PK">Pakistan</option>
                      <option value="SA">Saudi Arabia</option>
                      <option value="CN">China</option>
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-black">
                    Payment status
                    <select name="payment_status" defaultValue={paymentStatus} className="rounded-xl border border-slate-300 px-4 py-3">
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="waived">Waived</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-black">
                    Internal note
                    <input name="note" defaultValue={String(row.note || "")} className="rounded-xl border border-slate-300 px-4 py-3" />
                  </label>

                  <div className="flex items-end">
                    <button className="min-h-12 w-full rounded-xl bg-slate-950 px-6 text-sm font-black text-white">
                      Save
                    </button>
                  </div>
                </form>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/auth";
import { updateCourseEnrollmentAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;

type PageProps = {
  params: Promise<{
    courseId: string;
  }>;
  searchParams?: Promise<{
    q?: string;
    status?: string;
    message?: string;
    error?: string;
  }>;
};

function title(course: Row) {
  return String(
    course.title ||
      course.name ||
      course.course_title ||
      "Untitled course"
  );
}

function displayName(profile: Row | undefined, enrollment: Row) {
  return String(
    profile?.full_name ||
      profile?.display_name ||
      profile?.name ||
      enrollment.full_name ||
      enrollment.name ||
      enrollment.email ||
      "Course participant"
  );
}

function displayEmail(profile: Row | undefined, enrollment: Row) {
  return String(
    profile?.email ||
      enrollment.email ||
      ""
  );
}

function dateLabel(value: unknown) {
  if (!value) return "Unknown date";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusValue(enrollment: Row) {
  return String(
    enrollment.registration_status ||
      enrollment.status ||
      "confirmed"
  ).toLowerCase();
}

export default async function CourseRegistrationDetailPage({
  params,
  searchParams,
}: PageProps) {
  noStore();

  const { courseId } = await params;
  const filters = searchParams ? await searchParams : {};
  const actor = await requireManagerOrAdmin(
    `/manager/course-registrations/${courseId}`
  );

  const [
    { data: course, error: courseError },
    { data: enrollmentRows, error: enrollmentError },
  ] = await Promise.all([
    actor.admin
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .maybeSingle(),

    actor.admin
      .from("enrollments")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
  ]);

  if (courseError || !course) {
    notFound();
  }

  const enrollments = (enrollmentRows || []) as Row[];
  const userIds = Array.from(
    new Set(
      enrollments
        .map((row) => String(row.user_id || ""))
        .filter(Boolean)
    )
  );

  let profiles: Row[] = [];

  if (userIds.length > 0) {
    const result = await actor.admin
      .from("profiles")
      .select("*")
      .in("id", userIds);

    profiles = (result.data || []) as Row[];
  }

  const profilesById = new Map(
    profiles.map((profile) => [
      String(profile.id || ""),
      profile,
    ])
  );

  const query = String(filters.q || "")
    .trim()
    .toLowerCase();

  const statusFilter = String(filters.status || "")
    .trim()
    .toLowerCase();

  const visible = enrollments.filter((enrollment) => {
    const profile = profilesById.get(
      String(enrollment.user_id || "")
    );

    const searchable = [
      displayName(profile, enrollment),
      displayEmail(profile, enrollment),
      enrollment.user_id,
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery =
      !query || searchable.includes(query);

    const matchesStatus =
      !statusFilter ||
      statusFilter === "all" ||
      statusValue(enrollment) === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const confirmedCount = enrollments.filter(
    (item) => statusValue(item) === "confirmed"
  ).length;

  const pendingCount = enrollments.filter(
    (item) => statusValue(item) === "pending"
  ).length;

  const grantedCount = enrollments.filter(
    (item) =>
      String(item.access_status || "granted") === "granted"
  ).length;

  return (
    <main
      className="min-h-screen bg-[#f6f8fb] px-4 pb-16 sm:px-6 lg:px-8"
      style={{ paddingTop: "128px" }}
    >
      <div className="mx-auto w-full max-w-[1480px] space-y-6">
        <Link
          href="/manager/course-registrations"
          className="text-sm font-black text-slate-600 hover:text-slate-950"
        >
          &larr; All course registrations
        </Link>

        <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
            Course registration workspace
          </p>

          <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
            {title(course)}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Manage only the registrations belonging to this course.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <p className="text-xs font-black uppercase text-slate-500">
                Total
              </p>
              <p className="mt-1 text-2xl font-black">
                {enrollments.length}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 px-5 py-4">
              <p className="text-xs font-black uppercase text-emerald-700">
                Confirmed
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-950">
                {confirmedCount}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 px-5 py-4">
              <p className="text-xs font-black uppercase text-amber-700">
                Pending
              </p>
              <p className="mt-1 text-2xl font-black text-amber-950">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-5 py-4">
              <p className="text-xs font-black uppercase text-blue-700">
                Access granted
              </p>
              <p className="mt-1 text-2xl font-black text-blue-950">
                {grantedCount}
              </p>
            </div>
          </div>
        </header>

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

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <input
              name="q"
              defaultValue={filters.q || ""}
              placeholder="Search participant name or email"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <select
              name="status"
              defaultValue={filters.status || "all"}
              className="rounded-xl border border-slate-300 px-4 py-3 font-bold"
            >
              <option value="all">All registrations</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
              Apply filters
            </button>
          </form>
        </section>

        <section className="space-y-4">
          {visible.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <p className="font-black text-slate-800">
                No registrations match these filters.
              </p>
            </div>
          ) : (
            visible.map((enrollment) => {
              const profile = profilesById.get(
                String(enrollment.user_id || "")
              );

              const registrationStatus =
                statusValue(enrollment);

              const paymentStatus = String(
                enrollment.payment_status || "waived"
              ).toLowerCase();

              const accessStatus = String(
                enrollment.access_status || "granted"
              ).toLowerCase();

              return (
                <article
                  key={String(enrollment.id)}
                  className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/80 p-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-black text-slate-950">
                        {displayName(profile, enrollment)}
                      </h2>

                      <p className="mt-1 break-all text-sm text-slate-600">
                        {displayEmail(profile, enrollment) ||
                          String(enrollment.user_id || "")}
                      </p>

                      <p className="mt-2 text-xs font-bold text-slate-500">
                        Registered: {dateLabel(enrollment.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                        Registration: {registrationStatus}
                      </span>

                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                        Payment: {paymentStatus}
                      </span>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                        Access: {accessStatus}
                      </span>
                    </div>
                  </div>

                  <form
                    action={updateCourseEnrollmentAction}
                    className="grid gap-4 p-5 xl:grid-cols-3"
                  >
                    <input
                      type="hidden"
                      name="enrollment_id"
                      value={String(enrollment.id)}
                    />

                    <input
                      type="hidden"
                      name="course_id"
                      value={courseId}
                    />

                    <label className="grid gap-2 text-sm font-black text-slate-700">
                      Registration
                      <select
                        name="registration_status"
                        defaultValue={registrationStatus}
                        className="rounded-xl border border-slate-300 px-4 py-3 font-bold"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>

                    <label className="grid gap-2 text-sm font-black text-slate-700">
                      Payment
                      <select
                        name="payment_status"
                        defaultValue={paymentStatus}
                        className="rounded-xl border border-slate-300 px-4 py-3 font-bold"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="paid">Paid</option>
                        <option value="waived">Waived</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </label>

                    <label className="grid gap-2 text-sm font-black text-slate-700">
                      Course access
                      <select
                        name="access_status"
                        defaultValue={accessStatus}
                        className="rounded-xl border border-slate-300 px-4 py-3 font-bold"
                      >
                        <option value="pending">Pending</option>
                        <option value="granted">Granted</option>
                        <option value="revoked">Revoked</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </label>

                    <label className="grid gap-2 text-sm font-black text-slate-700">
                      Amount received
                      <input
                        name="amount_received"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={String(
                          enrollment.amount_received || 0
                        )}
                        className="rounded-xl border border-slate-300 px-4 py-3"
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-black text-slate-700">
                      Currency
                      <input
                        name="payment_currency"
                        maxLength={8}
                        defaultValue={String(
                          enrollment.payment_currency || "USD"
                        )}
                        className="rounded-xl border border-slate-300 px-4 py-3 uppercase"
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-black text-slate-700">
                      Receipt URL
                      <input
                        name="receipt_url"
                        type="url"
                        defaultValue={String(
                          enrollment.receipt_url || ""
                        )}
                        className="rounded-xl border border-slate-300 px-4 py-3"
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-black text-slate-700 xl:col-span-3">
                      Payment or registration note
                      <textarea
                        name="payment_note"
                        rows={3}
                        defaultValue={String(
                          enrollment.payment_note || ""
                        )}
                        className="rounded-xl border border-slate-300 px-4 py-3"
                      />
                    </label>

                    <div className="flex justify-end xl:col-span-3">
                      <button className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800">
                        Save participant
                      </button>
                    </div>
                  </form>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
$ErrorActionPreference = "Stop"

$root = (Get-Location).Path

$required = @(
    "package.json",
    "lib\auth.ts"
)

foreach ($relative in $required) {
    $path = Join-Path $root $relative

    if (-not (Test-Path -LiteralPath $path)) {
        throw "Cannot find required file: $path`nRun this script from the project root."
    }
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root "_backups\course-registration-manager-$timestamp"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$utf8 = New-Object System.Text.UTF8Encoding($false)

function Write-Utf8 {
    param(
        [string]$Path,
        [string]$Content
    )

    $directory = Split-Path -Parent $Path

    if ($directory -and -not (Test-Path -LiteralPath $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }

    if (Test-Path -LiteralPath $Path) {
        $relative = $Path.Substring($root.Length).TrimStart("\", "/")
        $backup = Join-Path $backupRoot $relative

        New-Item -ItemType Directory `
            -Path (Split-Path -Parent $backup) `
            -Force |
            Out-Null

        Copy-Item `
            -LiteralPath $Path `
            -Destination $backup `
            -Force
    }

    [System.IO.File]::WriteAllText(
        $Path,
        $Content,
        $utf8
    )
}

# ============================================================
# SQL MIGRATION
# ============================================================

$migration = @'
-- Course-wise registration management fields.
-- Existing enrollments remain accessible after this migration.

alter table public.enrollments
  add column if not exists registration_status text
  not null default 'confirmed';

alter table public.enrollments
  add column if not exists payment_status text
  not null default 'waived';

alter table public.enrollments
  add column if not exists access_status text
  not null default 'granted';

alter table public.enrollments
  add column if not exists amount_received numeric(14, 2)
  not null default 0;

alter table public.enrollments
  add column if not exists payment_currency text
  not null default 'USD';

alter table public.enrollments
  add column if not exists payment_note text;

alter table public.enrollments
  add column if not exists receipt_url text;

alter table public.enrollments
  add column if not exists updated_at timestamptz
  not null default now();

alter table public.enrollments
  drop constraint if exists enrollments_registration_status_check;

alter table public.enrollments
  add constraint enrollments_registration_status_check
  check (
    registration_status in (
      'pending',
      'confirmed',
      'rejected',
      'cancelled'
    )
  );

alter table public.enrollments
  drop constraint if exists enrollments_payment_status_check;

alter table public.enrollments
  add constraint enrollments_payment_status_check
  check (
    payment_status in (
      'pending',
      'confirmed',
      'paid',
      'waived',
      'refunded'
    )
  );

alter table public.enrollments
  drop constraint if exists enrollments_access_status_check;

alter table public.enrollments
  add constraint enrollments_access_status_check
  check (
    access_status in (
      'pending',
      'granted',
      'revoked',
      'blocked'
    )
  );

create index if not exists enrollments_course_id_idx
on public.enrollments(course_id);

create index if not exists enrollments_course_status_idx
on public.enrollments(
  course_id,
  registration_status,
  payment_status,
  access_status
);

notify pgrst, 'reload schema';
'@

Write-Utf8 `
    -Path (Join-Path $root "supabase\migrations\20260728_course_registration_management.sql") `
    -Content $migration

# ============================================================
# SERVER ACTIONS
# ============================================================

$actions = @'
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/auth";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function safeCourseId(value: string) {
  return /^[A-Za-z0-9_-]+$/.test(value) ? value : "";
}

function destination(
  courseId: string,
  key: "message" | "error",
  value: string
) {
  const params = new URLSearchParams();
  params.set(key, value);

  return (
    `/manager/course-registrations/${encodeURIComponent(courseId)}` +
    `?${params.toString()}`
  );
}

const registrationStatuses = new Set([
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
]);

const paymentStatuses = new Set([
  "pending",
  "confirmed",
  "paid",
  "waived",
  "refunded",
]);

const accessStatuses = new Set([
  "pending",
  "granted",
  "revoked",
  "blocked",
]);

export async function updateCourseEnrollmentAction(
  formData: FormData
) {
  const actor = await requireManagerOrAdmin(
    "/manager/course-registrations"
  );

  const enrollmentId = text(formData, "enrollment_id");
  const courseId = safeCourseId(text(formData, "course_id"));

  const registrationStatus = text(
    formData,
    "registration_status"
  );

  const paymentStatus = text(
    formData,
    "payment_status"
  );

  const accessStatus = text(
    formData,
    "access_status"
  );

  const amountText = text(formData, "amount_received");
  const amount = amountText ? Number(amountText) : 0;

  const paymentCurrency =
    text(formData, "payment_currency").toUpperCase() || "USD";

  const paymentNote = text(formData, "payment_note") || null;
  const receiptUrl = text(formData, "receipt_url") || null;

  if (!courseId || !enrollmentId) {
    redirect(
      "/manager/course-registrations?error=Invalid enrollment."
    );
  }

  if (!registrationStatuses.has(registrationStatus)) {
    redirect(
      destination(
        courseId,
        "error",
        "Invalid registration status."
      )
    );
  }

  if (!paymentStatuses.has(paymentStatus)) {
    redirect(
      destination(courseId, "error", "Invalid payment status.")
    );
  }

  if (!accessStatuses.has(accessStatus)) {
    redirect(
      destination(courseId, "error", "Invalid access status.")
    );
  }

  if (!Number.isFinite(amount) || amount < 0) {
    redirect(
      destination(
        courseId,
        "error",
        "Amount received must be zero or greater."
      )
    );
  }

  const { error } = await actor.admin
    .from("enrollments")
    .update({
      registration_status: registrationStatus,
      payment_status: paymentStatus,
      access_status: accessStatus,
      amount_received: amount,
      payment_currency: paymentCurrency,
      payment_note: paymentNote,
      receipt_url: receiptUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId)
    .eq("course_id", courseId);

  if (error) {
    redirect(destination(courseId, "error", error.message));
  }

  revalidatePath("/manager/course-registrations");
  revalidatePath(
    `/manager/course-registrations/${courseId}`
  );
  revalidatePath("/my/courses");
  revalidatePath("/dashboard");

  redirect(
    destination(courseId, "message", "Enrollment updated.")
  );
}
'@

Write-Utf8 `
    -Path (Join-Path $root "app\manager\course-registrations\actions.ts") `
    -Content $actions

# ============================================================
# COURSE INDEX PAGE
# ============================================================

$indexPage = @'
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
'@

Write-Utf8 `
    -Path (Join-Path $root "app\manager\course-registrations\page.tsx") `
    -Content $indexPage

# ============================================================
# ONE-COURSE REGISTRATION PAGE
# ============================================================

$detailPage = @'
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
'@

Write-Utf8 `
    -Path (Join-Path $root "app\manager\course-registrations\[courseId]\page.tsx") `
    -Content $detailPage

# ============================================================
# OPTIONAL MANAGER DASHBOARD LINK
# ============================================================

$managerPagePath = Join-Path $root "app\manager\page.tsx"

if (Test-Path -LiteralPath $managerPagePath) {
    $managerContent = [System.IO.File]::ReadAllText(
        $managerPagePath,
        [System.Text.Encoding]::UTF8
    )

    if (
        -not $managerContent.Contains(
            "/manager/course-registrations"
        )
    ) {
        $linkBlock = @'
        <Link
          href="/manager/course-registrations"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
            Courses
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            Course registrations
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage participants one course at a time.
          </p>
        </Link>
'@

        $closingMain = $managerContent.LastIndexOf("</main>")

        if ($closingMain -ge 0) {
            $managerContent = $managerContent.Insert(
                $closingMain,
                $linkBlock
            )

            $relative = "app\manager\page.tsx"
            $backup = Join-Path $backupRoot $relative

            New-Item -ItemType Directory `
                -Path (Split-Path -Parent $backup) `
                -Force |
                Out-Null

            Copy-Item `
                -LiteralPath $managerPagePath `
                -Destination $backup `
                -Force

            [System.IO.File]::WriteAllText(
                $managerPagePath,
                $managerContent,
                $utf8
            )
        }
    }
}

# Exclude backups from TypeScript.
$tsconfigPath = Join-Path $root "tsconfig.json"

if (Test-Path -LiteralPath $tsconfigPath) {
    $tempScript = Join-Path $env:TEMP "course-registration-tsconfig-$timestamp.cjs"

    $nodeScript = @'
const fs = require("fs");
const path = require("path");
const root = process.cwd();
const file = path.join(root, "tsconfig.json");
const ts = require(require.resolve("typescript", { paths: [root] }));
const source = fs.readFileSync(file, "utf8");
const parsed = ts.parseConfigFileTextToJson(file, source);

if (parsed.error) {
  throw new Error(
    ts.flattenDiagnosticMessageText(parsed.error.messageText, "\n")
  );
}

const config = parsed.config || {};
const current = Array.isArray(config.exclude) ? config.exclude : [];

config.exclude = Array.from(new Set([
  ...current,
  "node_modules",
  ".next",
  "_backups",
  "**/*.backup-*"
]));

fs.writeFileSync(
  file,
  JSON.stringify(config, null, 2) + "\n",
  "utf8"
);
'@

    [System.IO.File]::WriteAllText(
        $tempScript,
        $nodeScript,
        $utf8
    )

    try {
        node $tempScript

        if ($LASTEXITCODE -ne 0) {
            throw "Could not update tsconfig.json."
        }
    }
    finally {
        Remove-Item `
            -LiteralPath $tempScript `
            -Force `
            -ErrorAction SilentlyContinue
    }
}

Remove-Item `
    -LiteralPath (Join-Path $root ".next") `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

$packageJson = Get-Content `
    -LiteralPath (Join-Path $root "package.json") `
    -Raw |
    ConvertFrom-Json

$scripts = $packageJson.scripts

Write-Host ""
Write-Host "Course-wise registration manager installed." -ForegroundColor Green
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host "  $backupRoot"
Write-Host ""
Write-Host "Running TypeScript validation..." -ForegroundColor Yellow

if (
    $null -ne $scripts -and
    $scripts.PSObject.Properties.Name -contains "typecheck"
) {
    npm.cmd run typecheck
}
else {
    npx.cmd tsc --noEmit
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "TypeScript validation failed." -ForegroundColor Red
    Write-Host "Backup:" -ForegroundColor Yellow
    Write-Host "  $backupRoot"
    exit 1
}

Write-Host ""
Write-Host "TypeScript validation passed." -ForegroundColor Green

if (
    $null -ne $scripts -and
    $scripts.PSObject.Properties.Name -contains "build"
) {
    Write-Host ""
    Write-Host "Running production build..." -ForegroundColor Yellow
    npm.cmd run build

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Production build failed." -ForegroundColor Red
        Write-Host "Backup:" -ForegroundColor Yellow
        Write-Host "  $backupRoot"
        exit 1
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "COURSE REGISTRATION MANAGER COMPLETE" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Required Supabase step:" -ForegroundColor Yellow
Write-Host "Run this migration in Supabase SQL Editor:"
Write-Host "  supabase\migrations\20260728_course_registration_management.sql"
Write-Host ""
Write-Host "Then restart:" -ForegroundColor Yellow
Write-Host "  npm.cmd run dev"
Write-Host ""
Write-Host "Course registration index:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/manager/course-registrations"

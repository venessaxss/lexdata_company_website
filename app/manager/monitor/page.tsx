import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Registration = {
  id: string;
  status?: string | null;
  payment_status?: string | null;
  amount_received?: number | null;
  payment_currency?: string | null;
  created_at?: string | null;
  workshops?: {
    title?: string | null;
    slug?: string | null;
  } | null;
};

type PaymentRecord = {
  id: string;
  action_type?: string | null;
  payment_status?: string | null;
  amount?: number | null;
  currency?: string | null;
  created_at?: string | null;
};

type SiteVisit = {
  id: string;
  visitor_id?: string | null;
  user_id?: string | null;
  user_role?: string | null;
  path?: string | null;
  title?: string | null;
  referrer?: string | null;
  created_at?: string | null;
};

type Workshop = {
  id: string;
  title?: string | null;
  slug?: string | null;
  recruitment_status?: string | null;
  process_status?: string | null;
  created_at?: string | null;
};

type Course = {
  id: string;
  title?: string | null;
  recruitment_status?: string | null;
  process_status?: string | null;
  created_at?: string | null;
};

type Profile = {
  id: string;
  role?: string | null;
  created_at?: string | null;
};

async function requireManagerOrAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/manager/monitor");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = normalizeRole(profile?.role);

  if (!profile || (role !== "admin" && role !== "manager")) {
    redirect("/dashboard");
  }

  return role;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatStatus(value?: string | null) {
  if (!value) return "-";

  return value
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function countBy<T>(items: T[], getKey: (item: T) => string | null | undefined) {
  const result = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item) || "unknown";
    result.set(key, (result.get(key) ?? 0) + 1);
  }

  return Array.from(result.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function sumAmount(items: { amount?: number | null; amount_received?: number | null }[]) {
  return items.reduce((total, item) => {
    const value = item.amount ?? item.amount_received ?? 0;
    return total + Number(value || 0);
  }, 0);
}

function isWithinDays(value: string | null | undefined, days: number) {
  if (!value) return false;

  const date = new Date(value);
  const now = new Date();

  const diff = now.getTime() - date.getTime();

  return diff <= days * 24 * 60 * 60 * 1000;
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>
      <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

function MiniTable({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; count: number }[];
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No data yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
            >
              <span className="font-semibold text-slate-700">
                {formatStatus(row.key)}
              </span>
              <span className="font-black text-slate-950">{row.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function ManagerMonitorPage() {
  noStore();

  const role = await requireManagerOrAdmin();

  const supabase = createAdminClient();

  const [
    registrationsResult,
    paymentRecordsResult,
    visitsResult,
    workshopsResult,
    coursesResult,
    profilesResult,
  ] = await Promise.all([
    supabase
      .from("workshop_registrations")
      .select(
        `
        id,
        status,
        payment_status,
        amount_received,
        payment_currency,
        created_at,
        workshops:workshop_id (
          title,
          slug
        )
      `
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("workshop_payment_records")
      .select("id, action_type, payment_status, amount, currency, created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("site_visit_records")
      .select("id, visitor_id, user_id, user_role, path, title, referrer, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),

    supabase
      .from("workshops")
      .select("id, title, slug, recruitment_status, process_status, created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("courses")
      .select("id, title, recruitment_status, process_status, created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("id, role, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const registrations = (registrationsResult.data ?? []) as Registration[];
  const paymentRecords = (paymentRecordsResult.data ?? []) as PaymentRecord[];
  const visits = (visitsResult.data ?? []) as SiteVisit[];
  const workshops = (workshopsResult.data ?? []) as Workshop[];
  const courses = (coursesResult.data ?? []) as Course[];
  const profiles = (profilesResult.data ?? []) as Profile[];

  const totalRegistrations = registrations.length;
  const registrationsToday = registrations.filter((item) =>
    isWithinDays(item.created_at, 1)
  ).length;
  const registrations7Days = registrations.filter((item) =>
    isWithinDays(item.created_at, 7)
  ).length;

  const confirmedRegistrations = registrations.filter(
    (item) =>
      item.status === "confirmed" ||
      item.payment_status === "confirmed" ||
      item.payment_status === "paid" ||
      item.payment_status === "waived"
  );

  const totalConfirmedAmount = confirmedRegistrations.reduce((total, item) => {
    return total + Number(item.amount_received || 0);
  }, 0);

  const totalPaymentRecordAmount = sumAmount(paymentRecords);

  const totalVisits = visits.length;
  const visitsToday = visits.filter((item) =>
    isWithinDays(item.created_at, 1)
  ).length;
  const visits7Days = visits.filter((item) =>
    isWithinDays(item.created_at, 7)
  ).length;

  const uniqueVisitors = new Set(
    visits.map((visit) => visit.visitor_id).filter(Boolean)
  ).size;

  const loggedInVisits = visits.filter((visit) => Boolean(visit.user_id)).length;

  const topPages = countBy(visits, (visit) => visit.path).slice(0, 8);

  const registrationsByStatus = countBy(registrations, (item) => item.status);
  const paymentsByStatus = countBy(registrations, (item) => item.payment_status);
  const paymentActions = countBy(paymentRecords, (item) => item.action_type);
  const visitsByRole = countBy(visits, (item) => item.user_role || "guest");
  const usersByRole = countBy(profiles, (item) => normalizeRole(item.role));
  const workshopsByRecruitment = countBy(
    workshops,
    (item) => item.recruitment_status || "open"
  );
  const workshopsByProcess = countBy(
    workshops,
    (item) => item.process_status || "not_started"
  );
  const coursesByRecruitment = countBy(
    courses,
    (item) => item.recruitment_status || "open"
  );
  const coursesByProcess = countBy(
    courses,
    (item) => item.process_status || "not_started"
  );

  const recentRegistrations = registrations.slice(0, 8);
  const recentVisits = visits.slice(0, 12);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <Link
          href={role === "admin" ? "/admin" : "/manager"}
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to dashboard
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
          Data Monitor
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Overall Monitoring Board
        </h1>

        <p className="mt-4 max-w-3xl text-slate-600">
          View registration statistics, payment statistics, website visit
          records, workshop and course status, and user activity from one
          manager/admin board.
        </p>
      </div>

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Registrations"
          value={totalRegistrations}
          description={`${registrationsToday} today, ${registrations7Days} in the last 7 days`}
        />

        <StatCard
          title="Confirmed access"
          value={confirmedRegistrations.length}
          description="Confirmed, paid, or waived registrations"
        />

        <StatCard
          title="Confirmed amount"
          value={`USD ${totalConfirmedAmount.toFixed(2)}`}
          description="Based on current registration records"
        />

        <StatCard
          title="Payment records"
          value={`USD ${totalPaymentRecordAmount.toFixed(2)}`}
          description={`${paymentRecords.length} manual payment history records`}
        />

        <StatCard
          title="Visits tracked"
          value={totalVisits}
          description={`${visitsToday} today, ${visits7Days} in the last 7 days`}
        />

        <StatCard
          title="Unique visitors"
          value={uniqueVisitors}
          description="Based on browser visitor IDs"
        />

        <StatCard
          title="Logged-in visits"
          value={loggedInVisits}
          description="Visits made by authenticated users"
        />

        <StatCard
          title="Users"
          value={profiles.length}
          description="Total profile records"
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <MiniTable title="Registration Status" rows={registrationsByStatus} />
        <MiniTable title="Payment Status" rows={paymentsByStatus} />
        <MiniTable title="Payment Actions" rows={paymentActions} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <MiniTable title="Visits by Role" rows={visitsByRole} />
        <MiniTable title="Users by Role" rows={usersByRole} />
        <MiniTable title="Top Visited Pages" rows={topPages} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <MiniTable
          title="Workshop Recruitment Status"
          rows={workshopsByRecruitment}
        />

        <MiniTable title="Workshop Process Status" rows={workshopsByProcess} />

        <MiniTable
          title="Course Recruitment Status"
          rows={coursesByRecruitment}
        />

        <MiniTable title="Course Process Status" rows={coursesByProcess} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Recent Registrations
          </h2>

          {recentRegistrations.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No registrations yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <p className="font-bold text-slate-950">
                      {registration.workshops?.title || "Workshop"}
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      {formatDate(registration.created_at)}
                    </p>
                  </div>

                  <div className="mt-2 grid gap-1 md:grid-cols-2">
                    <p>Status: {formatStatus(registration.status)}</p>
                    <p>
                      Payment: {formatStatus(registration.payment_status)}
                    </p>
                    <p>
                      Amount: {registration.payment_currency || "USD"}{" "}
                      {registration.amount_received ?? 0}
                    </p>
                    {registration.workshops?.slug ? (
                      <Link
                        href={`/workshops/${registration.workshops.slug}`}
                        className="font-bold text-blue-700 hover:underline"
                      >
                        Open workshop
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Recent Website Visits
          </h2>

          {recentVisits.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No visit records yet. Visit tracking starts after the tracker is
              added to app/layout.tsx.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <p className="font-bold text-slate-950">
                      {visit.path || "/"}
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      {formatDate(visit.created_at)}
                    </p>
                  </div>

                  <div className="mt-2 grid gap-1 md:grid-cols-2">
                    <p>Role: {visit.user_role || "guest"}</p>
                    <p>User: {visit.user_id ? "Logged in" : "Guest"}</p>
                    <p className="md:col-span-2">
                      Referrer: {visit.referrer || "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
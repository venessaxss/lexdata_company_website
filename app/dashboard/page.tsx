import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, normalizeRole } from "@/lib/roles";

function StatCard({ href, label, value }: { href: string; label: string; value: number | string }) {
  return (
    <Link href={href} className="card p-5 hover:shadow-md">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </Link>
  );
}

function ActionCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      <p className="mt-4 text-sm font-semibold">Open →</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const { user, profile } = await requireProfile();
  const supabase = await createClient();
  const role = normalizeRole(profile.role);

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id,created_at,courses(id,title,slug,short_description)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: registrations } = await supabase
    .from("workshop_registrations")
    .select("id,created_at,workshop_sessions(id,title,starts_at,workshops(title,slug))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: payments } = await supabase
    .from("payments")
    .select("id,status,amount_cents")
    .eq("user_id", user.id);

  let speakerSessions: any[] = [];
  let managerPayments: any[] = [];
  let allRegistrations: any[] = [];
  let users: any[] = [];

  if (role === "speaker" || role === "instructor" || role === "admin") {
    const { data } = await supabase
      .from("workshop_sessions")
      .select("id,title,starts_at,workshops(title)")
      .eq(role === "admin" ? "is_published" : "speaker_id", role === "admin" ? true : user.id)
      .order("starts_at", { ascending: true });
    speakerSessions = data ?? [];
  }

  if (role === "manager" || role === "admin") {
    const { data: managerPaymentData } = await supabase
      .from("payments")
      .select("id,status,amount_cents,currency,created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: registrationData } = await supabase
      .from("workshop_registrations")
      .select("id,status,created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    managerPayments = managerPaymentData ?? [];
    allRegistrations = registrationData ?? [];
  }

  if (role === "admin") {
    const { data } = await supabase
      .from("profiles")
      .select("id,role")
      .limit(200);
    users = data ?? [];
  }

  const paidManagerPayments = managerPayments.filter((payment) => payment.status === "paid");
  const revenue = paidManagerPayments.reduce((sum, payment) => sum + Number(payment.amount_cents ?? 0), 0);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="badge w-fit">{ROLE_LABELS[role]}</p>
          <h1 className="mt-4 text-3xl font-bold">{ROLE_LABELS[role]} dashboard</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Welcome, {profile.full_name ?? user.email}. {ROLE_DESCRIPTIONS[role]}
          </p>
        </div>
        <Link href="/courses" className="btn-light w-fit">Browse courses</Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard href="/my/courses" label="Purchased courses" value={enrollments?.length ?? 0} />
        <StatCard href="/my/workshops" label="Registered workshops" value={registrations?.length ?? 0} />
        <StatCard href="/my/payments" label="My payment records" value={payments?.length ?? 0} />
      </div>

      {(role === "student") ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ActionCard href="/my/courses" title="Continue learning" body="Access your purchased courses, lessons, and learning progress." />
          <ActionCard href="/my/workshops" title="Workshop registrations" body="Check your live training sessions and meeting information." />
          <ActionCard href="/my/payments" title="Invoices and payments" body="Review pending, paid, failed, or refunded payment records." />
        </div>
      ) : null}

      {(role === "speaker" || role === "instructor") ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard href="/speaker/sessions" label="My training sessions" value={speakerSessions.length} />
          <ActionCard href="/speaker/attendees" title="Attendee lists" body="See registered participants for your own sessions." />
          <ActionCard href="/workshops" title="Public workshops" body="Review how your workshop pages appear to students." />
        </div>
      ) : null}

      {role === "manager" ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard href="/manager/payments" label="Recent payment records" value={managerPayments.length} />
          <StatCard href="/manager/registrations" label="Recent registrations" value={allRegistrations.length} />
          <StatCard href="/manager/payments" label="Paid revenue shown" value={`$${(revenue / 100).toFixed(2)}`} />
        </div>
      ) : null}

      {role === "admin" ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard href="/admin/users" label="Users loaded" value={users.length} />
          <StatCard href="/admin/workshops" label="Published sessions" value={speakerSessions.length} />
          <StatCard href="/manager/payments" label="Recent payments" value={managerPayments.length} />
          <ActionCard href="/admin/courses" title="Manage courses" body="Create, publish, edit, and delete course content." />
          <ActionCard href="/admin/workshops" title="Manage workshops" body="Create workshops, assign speakers, and publish sessions." />
          <ActionCard href="/admin/users" title="Manage users and roles" body="Assign student, speaker, manager, or admin roles." />
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent courses</h2>
            <Link href="/my/courses" className="text-sm font-medium">View all →</Link>
          </div>
          <div className="mt-4 space-y-3">
            {(enrollments ?? []).slice(0, 3).map((enrollment: any) => (
              <div key={enrollment.id} className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold">{enrollment.courses?.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{enrollment.courses?.short_description}</p>
                <Link href={`/courses/${enrollment.courses?.slug}`} className="mt-2 inline-block text-sm font-medium">Continue →</Link>
              </div>
            ))}
            {(!enrollments || enrollments.length === 0) ? <p className="text-sm text-slate-600">No courses yet.</p> : null}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming workshops</h2>
            <Link href="/my/workshops" className="text-sm font-medium">View all →</Link>
          </div>
          <div className="mt-4 space-y-3">
            {(registrations ?? []).slice(0, 3).map((registration: any) => (
              <div key={registration.id} className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold">{registration.workshop_sessions?.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{registration.workshop_sessions?.workshops?.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {registration.workshop_sessions?.starts_at ? new Date(registration.workshop_sessions.starts_at).toLocaleString() : "Time TBA"}
                </p>
              </div>
            ))}
            {(!registrations || registrations.length === 0) ? <p className="text-sm text-slate-600">No workshop registrations yet.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

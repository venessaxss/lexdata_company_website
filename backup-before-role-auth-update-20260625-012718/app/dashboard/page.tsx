import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", userData.user.id)
    .single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id,created_at,courses(id,title,slug,short_description)")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  const { data: registrations } = await supabase
    .from("workshop_registrations")
    .select("id,created_at,workshop_sessions(id,title,starts_at,workshops(title,slug))")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  const { data: payments } = await supabase
    .from("payments")
    .select("id,status")
    .eq("user_id", userData.user.id);

  const role = profile?.role ?? "student";

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">My dashboard</h1>
      <p className="mt-2 text-slate-600">Welcome, {profile?.full_name ?? userData.user.email}. Role: {role}.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link href="/my/courses" className="card p-5 hover:shadow-md">
          <p className="text-sm text-slate-500">Purchased courses</p>
          <p className="mt-2 text-3xl font-bold">{enrollments?.length ?? 0}</p>
        </Link>
        <Link href="/my/workshops" className="card p-5 hover:shadow-md">
          <p className="text-sm text-slate-500">Registered workshops</p>
          <p className="mt-2 text-3xl font-bold">{registrations?.length ?? 0}</p>
        </Link>
        <Link href="/my/payments" className="card p-5 hover:shadow-md">
          <p className="text-sm text-slate-500">Payment records</p>
          <p className="mt-2 text-3xl font-bold">{payments?.length ?? 0}</p>
        </Link>
      </div>

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
                <p className="mt-1 text-sm text-slate-500">{registration.workshop_sessions?.starts_at ? new Date(registration.workshop_sessions.starts_at).toLocaleString() : "Time TBA"}</p>
              </div>
            ))}
            {(!registrations || registrations.length === 0) ? <p className="text-sm text-slate-600">No workshop registrations yet.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

import { requireManagerOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ManagerRegistrationsPage() {
  await requireManagerOrAdmin();
  const supabase = await createClient();

  const { data: registrations } = await supabase
    .from("workshop_registrations")
    .select("id,status,created_at,profiles(full_name),workshop_sessions(title,starts_at,workshops(title))")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-bold">Registration records</h1>
      <p className="mt-2 text-slate-600">All workshop registrations for management review.</p>
      <div className="card mt-8 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="p-4">Student</th><th>Workshop</th><th>Session</th><th>Status</th><th>Registered</th></tr>
          </thead>
          <tbody>
            {(registrations ?? []).map((item: any) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="p-4 font-medium">{item.profiles?.full_name ?? "Student"}</td>
                <td>{item.workshop_sessions?.workshops?.title}</td>
                <td>{item.workshop_sessions?.title}</td>
                <td><span className="badge">{item.status}</span></td>
                <td>{new Date(item.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {(!registrations || registrations.length === 0) ? <tr><td className="p-4 text-slate-600" colSpan={5}>No registration records yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

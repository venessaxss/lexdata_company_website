import { requireSpeakerOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SpeakerAttendeesPage() {
  const { user, role } = await requireSpeakerOrAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("workshop_registrations")
    .select("id,status,created_at,profiles(full_name),workshop_sessions(title,starts_at,speaker_id,workshops(title))")
    .order("created_at", { ascending: false });

  const { data: registrations } = await query;
  const visible = role === "admin"
    ? registrations ?? []
    : (registrations ?? []).filter((r: any) => r.workshop_sessions?.speaker_id === user.id);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Attendee lists</h1>
      <p className="mt-2 text-slate-600">Registered participants for your training sessions.</p>

      <div className="card mt-8 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="p-4">Attendee</th><th>Workshop</th><th>Session</th><th>Status</th><th>Registered</th></tr>
          </thead>
          <tbody>
            {visible.map((item: any) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="p-4 font-medium">{item.profiles?.full_name ?? "Student"}</td>
                <td>{item.workshop_sessions?.workshops?.title}</td>
                <td>{item.workshop_sessions?.title}</td>
                <td><span className="badge">{item.status}</span></td>
                <td>{new Date(item.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {visible.length === 0 ? <tr><td className="p-4 text-slate-600" colSpan={5}>No attendees yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

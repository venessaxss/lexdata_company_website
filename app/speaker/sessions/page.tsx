import Link from "next/link";
import { requireSpeakerOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SpeakerSessionsPage() {
  const { user, profile } = await requireSpeakerOrAdmin();
  const role = profile.role;
  const supabase = await createClient();

  let query = supabase
    .from("workshop_sessions")
    .select("id,title,starts_at,ends_at,capacity,is_published,workshops(title,slug)")
    .order("starts_at", { ascending: true });

  if (role !== "admin") query = query.eq("speaker_id", user.id);

  const { data: sessions } = await query;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">My training sessions</h1>
      <p className="mt-2 text-slate-600">Sessions assigned to you as a speaker/trainer.</p>

      <div className="card mt-8 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="p-4">Session</th><th>Workshop</th><th>Time</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {(sessions ?? []).map((session: any) => (
              <tr key={session.id} className="border-t border-slate-100">
                <td className="p-4 font-medium">{session.title}</td>
                <td>{session.workshops?.title}</td>
                <td>{new Date(session.starts_at).toLocaleString()}</td>
                <td><span className="badge">{session.is_published ? "Published" : "Draft"}</span></td>
                <td><Link prefetch={false} href="/speaker/attendees" className="btn-light">Attendees</Link></td>
              </tr>
            ))}
            {(!sessions || sessions.length === 0) ? <tr><td className="p-4 text-slate-600" colSpan={5}>No sessions assigned yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

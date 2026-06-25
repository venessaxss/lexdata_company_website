import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MyWorkshopsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: registrations } = await supabase
    .from("workshop_registrations")
    .select("id,status,created_at,workshop_sessions(id,title,starts_at,ends_at,meeting_url,location,workshops(title,slug))")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">Registered workshops</h1>
      <p className="mt-2 text-slate-600">Live sessions and training workshops you registered for.</p>

      <div className="mt-8 grid gap-4">
        {(registrations ?? []).map((item: any) => {
          const session = item.workshop_sessions;
          return (
            <div key={item.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="badge">{item.status}</p>
                  <h2 className="mt-3 text-xl font-semibold">{session?.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{session?.workshops?.title}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {session?.starts_at ? new Date(session.starts_at).toLocaleString() : "Time TBA"}
                  </p>
                  {session?.meeting_url ? <p className="mt-2 text-sm">Meeting: <a href={session.meeting_url} className="underline">Open link</a></p> : null}
                  {session?.location ? <p className="mt-2 text-sm">Location: {session.location}</p> : null}
                </div>
                <Link href={`/workshops/${session?.workshops?.slug}`} className="btn-light">Workshop page</Link>
              </div>
            </div>
          );
        })}

        {(!registrations || registrations.length === 0) ? (
          <div className="card p-6 text-slate-600">
            You have not registered for a workshop yet. <Link href="/workshops" className="font-semibold underline">Browse workshops</Link>.
          </div>
        ) : null}
      </div>
    </section>
  );
}

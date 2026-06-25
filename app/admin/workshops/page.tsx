import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createWorkshop, createWorkshopSession } from "./actions";

export default async function AdminWorkshopsPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: workshops } = await supabase
    .from("workshops")
    .select("id,title,slug,is_published,created_at,profiles(full_name)")
    .order("created_at", { ascending: false });

  const { data: speakers } = await supabase
    .from("profiles")
    .select("id,full_name,role")
    .in("role", ["speaker", "admin"])
    .order("full_name");

  const { data: sessions } = await supabase
    .from("workshop_sessions")
    .select("id,title,starts_at,price_cents,currency,is_published,workshops(title)")
    .order("starts_at", { ascending: true });

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin: workshops</h1>
          <p className="mt-2 text-slate-600">Create workshops, assign speakers, and publish live training sessions.</p>
          {sp.message ? <p className="mt-3 text-sm text-red-600">{sp.message}</p> : null}
        </div>
        <Link href="/workshops" className="btn-light">View public page</Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form action={createWorkshop} className="card space-y-4 p-6">
          <h2 className="text-xl font-semibold">Create workshop</h2>
          <div><label className="label">Title</label><input name="title" className="input" required /></div>
          <div><label className="label">Slug</label><input name="slug" className="input" placeholder="ssci-writing-workshop" /></div>
          <div><label className="label">Speaker</label><select name="speaker_id" className="input"><option value="">No speaker yet</option>{(speakers ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.full_name ?? s.id}</option>)}</select></div>
          <div><label className="label">Short description</label><input name="short_description" className="input" /></div>
          <div><label className="label">Intro</label><textarea name="intro" className="textarea" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_published" /> Publish</label>
          <button className="btn-primary">Create workshop</button>
        </form>

        <form action={createWorkshopSession} className="card space-y-4 p-6">
          <h2 className="text-xl font-semibold">Add session</h2>
          <div><label className="label">Workshop</label><select name="workshop_id" className="input" required>{(workshops ?? []).map((w: any) => <option key={w.id} value={w.id}>{w.title}</option>)}</select></div>
          <div><label className="label">Session title</label><input name="title" className="input" required /></div>
          <div><label className="label">Speaker</label><select name="speaker_id" className="input"><option value="">Use workshop speaker/no speaker</option>{(speakers ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.full_name ?? s.id}</option>)}</select></div>
          <div className="grid gap-4 md:grid-cols-2"><div><label className="label">Starts at</label><input type="datetime-local" name="starts_at" className="input" required /></div><div><label className="label">Ends at</label><input type="datetime-local" name="ends_at" className="input" required /></div></div>
          <div className="grid gap-4 md:grid-cols-2"><div><label className="label">Capacity</label><input type="number" name="capacity" className="input" /></div><div><label className="label">Price cents</label><input type="number" name="price_cents" className="input" placeholder="9900" /></div></div>
          <div><label className="label">Currency</label><input name="currency" className="input" defaultValue="usd" /></div>
          <div><label className="label">Meeting URL</label><input name="meeting_url" className="input" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_published" /> Publish</label>
          <button className="btn-primary">Add session</button>
        </form>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <h2 className="p-4 text-xl font-semibold">Workshops</h2>
          <table className="w-full text-left text-sm"><tbody>{(workshops ?? []).map((w: any) => <tr key={w.id} className="border-t border-slate-100"><td className="p-4 font-medium">{w.title}</td><td>{w.is_published ? "Published" : "Draft"}</td><td><Link href={`/workshops/${w.slug}`} className="underline">View</Link></td></tr>)}</tbody></table>
        </div>
        <div className="card overflow-hidden">
          <h2 className="p-4 text-xl font-semibold">Sessions</h2>
          <table className="w-full text-left text-sm"><tbody>{(sessions ?? []).map((s: any) => <tr key={s.id} className="border-t border-slate-100"><td className="p-4 font-medium">{s.title}</td><td>{new Date(s.starts_at).toLocaleString()}</td><td>{s.is_published ? "Published" : "Draft"}</td></tr>)}</tbody></table>
        </div>
      </div>
    </section>
  );
}
